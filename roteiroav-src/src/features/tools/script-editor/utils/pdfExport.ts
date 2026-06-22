import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import { ScriptFull, ScriptMetadata, Take, Scene } from "../store/types";

// Setup fonts
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

const C = {
    black: '#000000',
    white: '#ffffff',
    gray: '#f5f5f5',
    darkGray: '#333333',
    line: '#cccccc',
    draft: '#888888',
    final: '#4fb496',
};

// Helper: Replica perfeitamente a matemática de transform CSS do TakeItem.tsx
const cropImageForPDF = async (
    imageUrl: string, 
    zoom: number, 
    imageX: number, 
    imageY: number, 
    flipX: boolean,
    flipY: boolean,
    aspect_ratio: string
): Promise<string | null> => {
    try {
        let localSrc = imageUrl;
        try {
            const cache = await caches.open("roteiroav-image-cache");
            let cachedResponse = await cache.match(imageUrl, { ignoreSearch: true });
            
            if (!cachedResponse) {
                const keys = await cache.keys();
                const targetBase = imageUrl.split('?')[0];
                const matchingKey = keys.find(k => k.url.split('?')[0] === targetBase);
                if (matchingKey) {
                    cachedResponse = await cache.match(matchingKey);
                }
            }

            if (!cachedResponse && imageUrl.startsWith('http')) {
                try {
                    const response = await fetch(imageUrl);
                    if (response.ok) {
                        await cache.put(imageUrl, response.clone());
                        cachedResponse = response;
                    }
                } catch (fetchErr) {
                    console.warn("Fetch failed for image:", fetchErr);
                }
            }

            if (cachedResponse) {
                const blob = await cachedResponse.blob();
                localSrc = URL.createObjectURL(blob);
            }
        } catch (err) {
            console.warn("Failed to retrieve or cache image for PDF:", err);
        }

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            if (localSrc.startsWith('http')) {
                i.crossOrigin = 'anonymous';
            }
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("Failed to load image"));
            i.src = localSrc;
        });

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;

        if (imgW === 0 || imgH === 0) return imageUrl;

        // Container aspect ratio
        const [arW, arH] = aspect_ratio.split(':').map(Number);
        
        // Output resolution mapping
        const OUTPUT_W = 800; // Fixed high-res
        const OUTPUT_H = Math.round(OUTPUT_W * arH / arW);

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_W;
        canvas.height = OUTPUT_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return imageUrl;

        // Apply rounded corners styling
        const radius = OUTPUT_W * 0.04; 
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(OUTPUT_W - radius, 0);
        ctx.quadraticCurveTo(OUTPUT_W, 0, OUTPUT_W, radius);
        ctx.lineTo(OUTPUT_W, OUTPUT_H - radius);
        ctx.quadraticCurveTo(OUTPUT_W, OUTPUT_H, OUTPUT_W - radius, OUTPUT_H);
        ctx.lineTo(radius, OUTPUT_H);
        ctx.quadraticCurveTo(0, OUTPUT_H, 0, OUTPUT_H - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();

        // 1. Center the context on the canvas
        ctx.translate(OUTPUT_W / 2, OUTPUT_H / 2);
        
        // 2. Apply CSS Translate (imageX and imageY are percentages of the container)
        const translateX = (imageX / 100) * OUTPUT_W;
        const translateY = (imageY / 100) * OUTPUT_H;
        ctx.translate(translateX, translateY);
        
        // 3. Apply Scale and Flip
        const fx = flipX ? -1 : 1;
        const fy = flipY ? -1 : 1;
        ctx.scale(zoom * fx, zoom * fy);

        // 4. Draw the actual image
        const drawH = OUTPUT_H;
        const drawW = imgW * (OUTPUT_H / imgH);

        // Draw centered
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        const result = canvas.toDataURL('image/jpeg', 0.92);
        
        // Clean up URL object if we created one
        if (localSrc.startsWith('blob:')) {
            URL.revokeObjectURL(localSrc);
        }

        return result;
    } catch (err) {
        console.warn("Could not read or crop image data (CORS or tainted canvas):", err);
        return null;
    }
};

export async function exportScriptToPDF(content: ScriptFull, metadata: ScriptMetadata) {
    try {
        const clientName = metadata?.clientName || 'Não informado';
        // Author from current user context
        const autorName = (metadata as any)?.authorName || 'Autor Desconhecido'; 
        const coverAuthorsText = autorName;
        const footerAuthorsText = autorName;

        const versionStr = metadata?.currentVersion
            ? (String(metadata.currentVersion).includes('.') ? `V${metadata.currentVersion}` : `V${String(metadata.currentVersion).padStart(2, '0')}`)
            : 'V01';

        const exportDate = new Date();
        const day = String(exportDate.getDate()).padStart(2, '0');
        const month = String(exportDate.getMonth() + 1).padStart(2, '0');
        const year = exportDate.getFullYear();
        const formattedDate = `${day}_${month}_${year}`;

        const takesWithImages = content.cenas.flatMap(c => c.takes).filter(t => t.imagemRef);
        const imageDict: Record<string, string> = {}; 
        
        await Promise.all(takesWithImages.map(async (take) => {
            if (take.imagemRef) {
                // Fetch exact state matching CSS styling in TakeItem:
                const imgX = take.imageX || 0;
                const imgY = take.imageY || 0;
                const zoom = take.imageScale || 1.0;
                const flipX = take.flipX || false;
                const flipY = take.flipY || false;
                
                const b64 = await cropImageForPDF(take.imagemRef, zoom, imgX, imgY, flipX, flipY, content.aspectRatio || '16:9');
                if (b64) imageDict[take.id] = b64;
            }
        }));

        const LARGURA_UTIL = 595 - 40 - 40; // A4 width 595.28 - margins
        const LARGURA_CELULA = (LARGURA_UTIL / 2) - 12;

        const aspectRatio = content.aspectRatio || '16:9';
        const [ar_w, ar_h] = aspectRatio.split(':').map(Number);
        const ALTURA_CONTAINER = LARGURA_CELULA * (ar_h / ar_w);

        const statusBg = metadata?.status === 'completed' ? '#E1F5EE' : '#F0F0F0';
        const statusColor = metadata?.status === 'completed' ? '#0F6E56' : '#666666';
        const statusText = metadata?.status === 'completed' ? 'FINAL' : 'RASCUNHO';

        const svgBar = `<svg width="${LARGURA_UTIL}" height="6" xmlns="http://www.w3.org/2000/svg"><rect width="${LARGURA_UTIL}" height="6" fill="#0D0D0D"/></svg>`;

        const pdfContent: Content[] = [];

        // --- PARTE 1: CAPA ---
        pdfContent.push(
            { text: (content.titulo || 'ROTEIRO AUDIOVISUAL').toUpperCase(), fontSize: 44, bold: true, color: '#0D0D0D', alignment: 'center', margin: [0, 240, 0, 24] },
            { text: coverAuthorsText, fontSize: 18, color: '#6B6B6B', alignment: 'center', margin: [0, 0, 0, 4] },
            { text: clientName, fontSize: 12, color: '#9B9B9B', alignment: 'center', margin: [0, 0, 0, 0], pageBreak: 'after' }
        );

        // --- PARTE 2: ROTEIRO ---
        content.cenas.forEach((scene: Scene, i: number) => {
            if (i > 0) {
                pdfContent.push({ text: '', margin: [0, 16, 0, 0] });
            }

            pdfContent.push({ text: `CENA ${String(scene.ordem).padStart(2, '0')} – ${scene.titulo.toUpperCase()}`, fontSize: 9, bold: true, color: '#0D0D0D', margin: [0, 20, 0, 8] });

            const tBody: TableCell[][] = [];
            tBody.push([
                { text: 'Nº', style: 'tableHeader' },
                { text: 'ÁUDIO', style: 'tableHeader' },
                { text: 'VISUAL', style: 'tableHeader' }
            ]);

            scene.takes.forEach((t: Take) => {
                tBody.push([
                    { text: `${scene.ordem}.${t.ordem}`, fontSize: 8, bold: true, alignment: 'center', color: '#0D0D0D' },
                    { text: t.audio || '', fontSize: 8, italics: true, color: '#2C2C2C', alignment: 'left' },
                    { text: t.visual || '', fontSize: 8, color: '#0D0D0D', alignment: 'left' }
                ]);
            });

            pdfContent.push({
                table: {
                    headerRows: 1,
                    dontBreakRows: true,
                    widths: [28, '*', '*'],
                    body: tBody
                },
                layout: {
                    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.3,
                    vLineWidth: (i, node) => (i === 0 || (node.table.widths && i === node.table.widths.length)) ? 0 : 0.3,
                    hLineColor: () => '#D8D8D8',
                    vLineColor: () => '#D8D8D8',
                    paddingLeft: () => 8,
                    paddingRight: () => 8,
                    paddingTop: () => 7,
                    paddingBottom: () => 7,
                    fillColor: (rowIndex) => {
                        if (rowIndex === 0) return '#0D0D0D';
                        return (rowIndex as number) % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
                    }
                }
            });
        });

        // --- PARTE 3: STORYBOARD ---
        pdfContent.push({ text: '', pageBreak: 'before', id: 'storyboardStart' });
        pdfContent.push({ text: 'STORYBOARD', fontSize: 9, bold: true, color: '#6B6B6B', margin: [0, 0, 0, 4] });
        pdfContent.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: LARGURA_UTIL, y2: 0, lineWidth: 0.5, lineColor: '#D8D8D8' }], margin: [0, 0, 0, 16] });

        content.cenas.forEach((scene: Scene) => {
            if (scene.takes.length === 0) return;

            pdfContent.push({ text: `— ${scene.titulo.split('–')[0].trim()} —`, fontSize: 7.5, color: '#9B9B9B', alignment: 'center', margin: [0, 8, 0, 12] });

            const storyboardRows: TableCell[][] = [];
            let currentRow: TableCell[] = [];

            scene.takes.forEach((t: Take) => {
                const b64Img = imageDict[t.id];
                let imageBlock: Content;

                if (b64Img) {
                    imageBlock = {
                        image: b64Img,
                        width: LARGURA_CELULA,
                        margin: [0, 0, 0, 6]
                    } as any; 
                } else {
                    const W = Math.round(LARGURA_CELULA);
                    const H = Math.round(ALTURA_CONTAINER);
                    imageBlock = {
                        svg: `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
              <rect width="${W}" height="${H}" fill="#EBEBEB" stroke="#D8D8D8" stroke-width="0.5"/>
              <rect x="${W/2-14}" y="${H/2-9}" width="28" height="18" rx="2" fill="#D8D8D8"/>
              <circle cx="${W/2}" cy="${H/2}" r="6" fill="#EBEBEB"/>
              <circle cx="${W/2}" cy="${H/2}" r="4" fill="#D8D8D8"/>
              <text x="${W/2}" y="${H-10}" text-anchor="middle" font-family="Helvetica" font-size="7" fill="#9B9B9B">SEM REFERÊNCIA</text>
            </svg>`,
                        margin: [0, 0, 0, 6]
                    };
                }

                const cellContent = {
                    stack: [
                        { text: `${scene.ordem}.${t.ordem}`, fontSize: 8, bold: true, color: '#9B9B9B', margin: [0, 0, 0, 4] },
                        imageBlock,
                        { text: t.visual || '', fontSize: 8, color: '#0D0D0D', margin: [0, 0, 0, 4] },
                        { text: t.audio || '', fontSize: 7.5, italics: true, color: '#6B6B6B' }
                    ]
                } as TableCell;

                currentRow.push(cellContent);

                if (currentRow.length === 2) {
                    storyboardRows.push(currentRow);
                    currentRow = [];
                }
            });

            if (currentRow.length === 1) {
                currentRow.push({ text: '', border: [false, false, false, false] } as TableCell);
                storyboardRows.push(currentRow);
            }

            if (storyboardRows.length > 0) {
                pdfContent.push({
                    table: {
                        widths: ['50%', '50%'],
                        dontBreakRows: true,
                        body: storyboardRows
                    },
                    layout: {
                        hLineWidth: () => 0,
                        vLineWidth: (i) => i === 1 ? 0.3 : 0,
                        vLineColor: () => '#D8D8D8',
                        paddingLeft: (i) => i === 0 ? 0 : 12,
                        paddingRight: (i) => i === 1 ? 0 : 12,
                        paddingBottom: () => 20,
                        paddingTop: () => 0,
                    }
                });
            }
        });

        const docDefinition: TDocumentDefinitions = {
            pageSize: 'A4',
            pageMargins: [40, 50, 40, 50],
            info: {
                title: content.titulo,
                author: footerAuthorsText,
                subject: content.descricao,
                creator: 'Roteiro AV'
            },
            header: function(currentPage) {
                if (currentPage === 1) return null;
                return {
                    columns: [
                        { text: (content.titulo || 'ROTEIRO').toUpperCase(), fontSize: 7, color: '#9B9B9B', alignment: 'left', margin: [40, 14, 0, 0] },
                        // Simpler logic for Roteiro vs Storyboard: PDFMake doesn't allow easy section tracking in header without rendering hacks, so we just use page number or keep it static.
                        // For exact matching, we can do a best effort or pass a static string if we can't determine it correctly.
                        { text: '', fontSize: 7, color: '#9B9B9B', alignment: 'center', margin: [0, 14, 0, 0] },
                        { text: '', margin: [0, 14, 40, 0] }
                    ]
                };
            },
            footer: function(currentPage, pageCount, pageSize) {
                const now = new Date();
                const datePart = now.toLocaleDateString('pt-BR');
                const timePart = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                if (currentPage === 1) {
                    return {
                        columns: [
                            { text: `Copyright © ${now.getFullYear()} ${footerAuthorsText}`, fontSize: 9, color: '#9B9B9B', alignment: 'left', margin: [40, 20, 0, 0] },
                            { text: `Exportado em ${datePart} ${timePart} (Horário de Brasília)`, fontSize: 9, color: '#9B9B9B', alignment: 'right', margin: [0, 20, 40, 0] }
                        ]
                    };
                }

                return {
                    stack: [
                        {
                            canvas: [{ type: 'line', x1: 40, y1: 0, x2: pageSize.width - 40, y2: 0, lineWidth: 0.3, lineColor: '#D8D8D8' }]
                        },
                        {
                            columns: [
                                { text: content.titulo || '', fontSize: 7, color: '#9B9B9B', alignment: 'left', margin: [40, 4, 0, 0] },
                                { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: '#9B9B9B', alignment: 'center', margin: [0, 4, 0, 0] },
                                { text: `Exportado em ${datePart}`, fontSize: 7, color: '#9B9B9B', alignment: 'right', margin: [0, 4, 40, 0] }
                            ]
                        }
                    ]
                };
            },
            content: pdfContent,
            styles: {
                tableHeader: {
                    fontSize: 8,
                    bold: true,
                    color: '#FFFFFF',
                    fillColor: '#0D0D0D',
                    alignment: 'center'
                }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 10,
                color: '#0D0D0D'
            }
        };

        const fileName = `${content.titulo || 'Roteiro_AV'} - ${versionStr} - ${formattedDate}.pdf`;
        pdfMake.createPdf(docDefinition).download(fileName);

    } catch (error) {
        console.error("Failed to generate PDF", error);
        alert("Ocorreu um erro ao gerar o PDF. Consulte o console.");
    }
}
