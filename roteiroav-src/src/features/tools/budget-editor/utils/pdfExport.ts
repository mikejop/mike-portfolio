import { BudgetStore } from "../store/types";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content, TableCell, StyleDictionary } from "pdfmake/interfaces";

// Type assertion to bypass TS error if vfs is not explicitly typed
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

export async function exportBudgetToPDF(store: BudgetStore) {
    try {
        const fmt = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const pNome = store.prestador.nome || 'Prestador de Serviços';
        const dataFmt = store.meta.data ? new Date(store.meta.data + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

        const C = {
            black: '#0c0c10', dark: '#191920', mid: '#5a554b', light: '#969084',
            bg: '#f8f6f1', bgAlt: '#f1efe9', white: '#ffffff',
            gold: '#a0731c', goldLt: '#d2af50', goldLine: '#c4a03c',
            lineGray: '#e1ded7', softLine: '#f0eee9', red: '#be4646'
        };

        const docDefinition: TDocumentDefinitions = {
            pageSize: 'A4',
            pageMargins: [40, 150, 40, 60], // [left, top, right, bottom]

            // Header: Background box and Text
            // FIX #1: Header only on page 1
            header: function (currentPage: number): Content {
                if (currentPage > 1) {
                    return { text: '', margin: [0, 0, 0, 0] };
                }
                return {
                    margin: [0, 0, 0, 0],
                    stack: [
                        {
                            canvas: [
                                { type: 'rect', x: 0, y: 0, w: 595.28, h: 120, color: C.dark },
                                { type: 'rect', x: 0, y: 118, w: 595.28, h: 2, color: C.gold }
                            ],
                            absolutePosition: { x: 0, y: 0 }
                        },
                        {
                            // FIX #2: Right margin — x:40 left, columnGap + width ensure ~25pt right padding
                            absolutePosition: { x: 40, y: 35 },
                            columns: [
                                {
                                    width: '*',
                                    stack: [
                                        { text: pNome, fontSize: pNome.length > 22 ? 18 : 22, bold: true, color: C.white, margin: [0, 0, 0, 4] },
                                        {
                                            text: [
                                                store.prestador.cnpj ? `CNPJ/CPF: ${store.prestador.cnpj}` : '',
                                                store.prestador.im ? `   |   Insc. Mun.: ${store.prestador.im}` : ''
                                            ].join(''),
                                            fontSize: 8, color: '#a59b7d', margin: [0, 0, 0, 2]
                                        },
                                        {
                                            text: [
                                                store.prestador.end ? `${store.prestador.end}` : '',
                                                store.prestador.cep ? ` - CEP: ${store.prestador.cep}` : ''
                                            ].join(''),
                                            fontSize: 8, color: '#87806c', margin: [0, 0, 0, 2]
                                        },
                                        {
                                            text: [
                                                store.prestador.tel ? `Tel: ${store.prestador.tel}` : '',
                                                store.prestador.email ? `   |   ${store.prestador.email}` : '',
                                                store.prestador.site ? `   |   ${store.prestador.site}` : ''
                                            ].join(''),
                                            fontSize: 8, color: '#87806c'
                                        }
                                    ]
                                },
                                {
                                    width: 150, // Reduced to leave ~25pt right margin
                                    margin: [0, 0, 25, 0], // 25pt right padding
                                    stack: [
                                        { text: `ORÇAMENTO #${store.meta.num || '001'}`, fontSize: 11, bold: true, color: C.goldLt, margin: [0, 0, 0, 4], alignment: 'right' as const },
                                        { text: dataFmt, fontSize: 10, color: '#beb496', margin: [0, 0, 0, 4], alignment: 'right' as const },
                                        { text: `Válido por ${store.meta.validade || '15'} dias`, fontSize: 9, color: '#8c846c', alignment: 'right' as const }
                                    ]
                                }
                            ]
                        }
                    ]
                };
            },

            // Footer: Pagination
            footer: function (currentPage: number, pageCount: number): Content {
                return {
                    margin: [0, 0, 0, 0],
                    stack: [
                        {
                            canvas: [
                                { type: 'rect', x: 0, y: 0, w: 595.28, h: 30, color: C.dark },
                                { type: 'rect', x: 0, y: 0, w: 595.28, h: 2, color: C.gold }
                            ],
                            absolutePosition: { x: 0, y: 0 }
                        },
                        {
                            absolutePosition: { x: 40, y: 10 },
                            columns: [
                                { text: pNome, fontSize: 8, color: '#87806c', width: '*' },
                                { text: `Gerado em ${new Date().toLocaleString('pt-BR')}   |   Pág. ${currentPage} / ${pageCount}`, fontSize: 7, color: '#6a6454', width: 300, alignment: 'right' as const }
                            ]
                        }
                    ]
                };
            },

            content: [],
            styles: {
                sectionTitle: { fontSize: 9, bold: true, color: C.white, margin: [0, 4, 0, 4] },
                tableHeader: { bold: true, fontSize: 8, color: C.dark, fillColor: C.bgAlt, margin: [0, 2, 0, 2] },
                tableCell: { fontSize: 9, color: C.dark, margin: [0, 4, 0, 4] },
                sumLabel: { fontSize: 9, color: C.mid, margin: [4, 4, 4, 4] },
                sumValue: { fontSize: 9, bold: true, color: C.dark, alignment: 'right', margin: [4, 4, 4, 4] }
            },
            defaultStyle: {
                font: 'Roboto'
            }
        };

        const content = docDefinition.content as Content[];

        // 1. CARDS: Cliente & Projeto
        const pjEntrFmt = store.projeto.entr ? new Date(store.projeto.entr + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
        const pjIniFmt = store.projeto.ini ? new Date(store.projeto.ini + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

        content.push({
            columns: [
                // Cliente Card
                {
                    width: '48%',
                    stack: [
                        { text: 'CLIENTE / CONTRATANTE', fontSize: 8, bold: true, color: C.gold, margin: [0, 0, 0, 4] },
                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 230, y2: 0, lineWidth: 0.5, lineColor: C.lineGray }] },
                        { text: store.cliente.nome || '—', fontSize: 11, bold: true, color: C.dark, margin: [0, 8, 0, 4] },
                        { text: store.cliente.cnpj ? `CNPJ/CPF: ${store.cliente.cnpj}` : '', fontSize: 9, color: C.mid, margin: [0, 0, 0, 2] },
                        { text: store.cliente.resp ? `Contato: ${store.cliente.resp}` : '', fontSize: 9, color: C.mid, margin: [0, 0, 0, 2] },
                        { text: store.cliente.tel ? `Tel: ${store.cliente.tel}` : '', fontSize: 9, color: C.mid, margin: [0, 0, 0, 2] },
                        { text: store.cliente.email || '', fontSize: 9, color: C.mid, margin: [0, 0, 0, 2] },
                        { text: store.cliente.end ? `End: ${store.cliente.end}` : '', fontSize: 8, color: C.mid, margin: [0, 2, 0, 0] }
                    ],
                    margin: [0, 0, 10, 20]
                },
                // Spacer
                { width: '4%', text: '' },
                // Projeto Card
                {
                    width: '48%',
                    stack: [
                        { text: 'DADOS DO PROJETO', fontSize: 8, bold: true, color: C.gold, margin: [0, 0, 0, 4] },
                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 230, y2: 0, lineWidth: 0.5, lineColor: C.lineGray }] },
                        { text: store.projeto.titulo || '—', fontSize: 11, bold: true, color: C.dark, margin: [0, 8, 0, 4] },
                        { text: store.projeto.camp ? `Campanha: ${store.projeto.camp}` : '', fontSize: 9, color: C.mid, margin: [0, 0, 0, 2] },
                        {
                            text: [
                                { text: 'Início: ', color: C.mid }, { text: pjIniFmt, color: C.dark },
                                { text: '   |   ', color: C.lineGray },
                                { text: 'Entrega: ', color: C.mid }, { text: pjEntrFmt, color: C.gold, bold: true }
                            ], fontSize: 9, margin: [0, 0, 0, 2]
                        },
                        { text: store.projeto.dias ? `Dias de Filmagem: ${store.projeto.dias}` : '', fontSize: 9, color: C.mid, margin: [0, 0, 0, 2] },
                        { text: store.projeto.locais?.filter(l => l).length ? `Locais: ${store.projeto.locais.filter(l => l).join(', ')}` : '', fontSize: 9, color: C.mid }
                    ],
                    margin: [0, 0, 0, 20]
                }
            ]
        });

        // 1.5 Projeto Briefing/Refs
        // FIX #4: Briefing text auto-expands without truncation
        if (store.projeto.brief || (store.projeto.refs && store.projeto.refs.filter(r => r).length > 0)) {
            const briefStack: Content[] = [];
            if (store.projeto.brief) {
                briefStack.push(
                    { text: 'BRIEFING / OBJETIVOS', fontSize: 8, bold: true, color: C.gold, margin: [0, 0, 0, 4] } as Content
                );
                briefStack.push(
                    { text: store.projeto.brief, fontSize: 9, color: C.mid, margin: [0, 0, 0, 8] } as Content
                );
            }
            if (store.projeto.refs?.filter(r => r).length) {
                briefStack.push(
                    { text: 'REFERÊNCIAS', fontSize: 8, bold: true, color: C.gold, margin: [0, 4, 0, 4] } as Content
                );
                briefStack.push(
                    { text: store.projeto.refs.filter(r => r).join(', '), fontSize: 9, color: C.mid } as Content
                );
            }
            content.push({
                stack: briefStack,
                margin: [0, 0, 0, 20]
            });
        }

        // 2. BUDGET SECTIONS - Simplified (Descriptions Only)
        const sectionColors: Record<string, string> = {
            pre: '#286e58', live: '#2a50a0', pos: '#a55830', '3d': '#6434a5', desp: '#76762a'
        };

        // FIX #5: Added Qty column to item tables
        const renderSection = (secKey: keyof typeof store.itens, title: string) => {
            const rows = store.itens[secKey];
            if (!rows || rows.length === 0) return;

            content.push({
                table: {
                    widths: ['*'],
                    body: [
                        [{ text: title, style: 'sectionTitle', fillColor: sectionColors[secKey], border: [false, false, false, false] }]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 10, 0, 0]
            });

            const tBody: TableCell[][] = [];
            rows.forEach((r, idx) => {
                const bg = idx % 2 === 0 ? C.white : C.bgAlt;
                tBody.push([
                    { text: r.desc || '—', style: 'tableCell', border: [false, false, false, true], fillColor: bg },
                    { text: `${r.qty ?? 1} ${r.unit || ''}`.trim(), fontSize: 8, color: C.mid, alignment: 'right' as const, border: [false, false, false, true], fillColor: bg, margin: [0, 4, 0, 4] }
                ]);
            });

            content.push({
                table: {
                    widths: ['*', 50],
                    body: tBody
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0,
                    hLineColor: () => C.softLine,
                    paddingLeft: () => 10,
                    paddingRight: () => 10,
                },
                margin: [0, 0, 0, 15]
            });
        };

        renderSection('pre', 'PRÉ-PRODUÇÃO');
        renderSection('live', 'PRODUÇÃO — LIVE ACTION');
        renderSection('pos', 'PÓS-PRODUÇÃO');
        renderSection('3d', '3D / CGI / ANIMAÇÃO');
        renderSection('desp', 'DESPESAS GERAIS & PRODUÇÃO EXECUTIVA');

        // 3. RESUMO FINANCEIRO (Still showing corrected totals, but hiding tax line)
        const getSecTot = (k: keyof typeof store.itens) => store.itens[k].reduce((acc, i) => acc + (i.total || 0), 0);
        const subRaw = getSecTot('pre') + getSecTot('live') + getSecTot('pos') + getSecTot('3d') + getSecTot('desp');
        
        // Calculate tax 6% on the raw subtotal (before discount in the editor logic, 
        // but user wants it without showing, so let's follow the editor total math exactly)
        const dp = parseFloat(store.financeiro.descPct) || 0;
        const dvRaw = subRaw * (dp / 100);
        const base = subRaw - dvRaw;
        const iss = base * 0.06;
        const totalGeral = base + iss;

        // NEW LOGIC: Embed tax into subtotal display
        // We show: Subtotal (Raw + ISS) 
        // Then: Discount
        // Resulting in the same Total Geral
        const subWithTax = subRaw + (subRaw * 0.06); 
        const dvWithTax = subWithTax * (dp / 100);

        const dpRows: TableCell[][] = [];
        dpRows.push([
            { text: 'Subtotal de Serviços', style: 'sumLabel', fillColor: C.bgAlt, border: [true, false, true, true] },
            { text: fmt(subWithTax), style: 'sumValue', fillColor: C.bgAlt, border: [false, false, true, true] }
        ]);

        if (dp > 0) {
            dpRows.push([
                { text: `Desconto (${dp}%)`, style: 'sumLabel', fillColor: C.bgAlt, border: [true, false, true, true] },
                { text: '- ' + fmt(dvWithTax), style: 'sumValue', fillColor: C.bgAlt, border: [false, false, true, true], color: C.red }
            ]);
        }

        // FIX #3: keepTogether on financial summary block
        content.push({
            unbreakable: true,
            columns: [
                { width: '*', text: '' },
                {
                    width: 250,
                    margin: [0, 20, 0, 0],
                    stack: [
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: 'RESUMO FINANCEIRO', fontSize: 9, bold: true, color: C.goldLt, fillColor: C.dark, border: [false, false, false, false], margin: [4, 4, 4, 4] }]
                                ]
                            },
                            layout: 'noBorders'
                        },
                        {
                            table: {
                                widths: ['*', 100],
                                body: dpRows
                            },
                            layout: {
                                defaultBorder: false,
                                hLineWidth: () => 0.5,
                                vLineWidth: () => 0.5,
                                hLineColor: () => C.lineGray,
                                vLineColor: () => C.lineGray,
                            }
                        },
                        {
                            margin: [0, 10, 0, 0],
                            table: {
                                widths: ['*', 120],
                                body: [
                                    [
                                        { text: 'TOTAL DO ORÇAMENTO', fontSize: 10, bold: true, color: '#b9af87', fillColor: C.dark, margin: [6, 12, 6, 12], border: [false, false, false, false] },
                                        { text: fmt(totalGeral), fontSize: 14, bold: true, color: C.goldLt, fillColor: C.dark, alignment: 'right', margin: [6, 10, 8, 10], border: [false, false, false, false] }
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                }
            ]
        } as any);

        // 4. CONDIÇÕES E OBS
        if (store.condicoes.obs || store.condicoes.prazo || store.condicoes.banco) {
            content.push({
                pageBreak: 'before' as const,
                stack: [
                    { text: 'CONDIÇÕES COMERCIAIS', fontSize: 10, bold: true, color: C.gold, margin: [0, 0, 0, 8] },
                    {
                        table: {
                            widths: ['*'],
                            body: [
                                [
                                    {
                                        stack: [
                                            store.condicoes.pag?.length ? { text: `• Pagamento: ${store.condicoes.pag.join(', ')}`, fontSize: 9, margin: [0, 2] } : '',
                                            store.condicoes.prazo ? { text: `• Prazo Global: ${store.condicoes.prazo}`, fontSize: 9, margin: [0, 2] } : '',
                                            store.condicoes.rev ? { text: `• Revisões: ${store.condicoes.rev}`, fontSize: 9, margin: [0, 2] } : '',
                                            store.condicoes.dir ? { text: `• Direitos: ${store.condicoes.dir}`, fontSize: 9, margin: [0, 2] } : '',
                                            store.condicoes.banco ? { text: `• Dados Bancários: ${store.condicoes.banco}`, fontSize: 9, margin: [0, 2, 0, 10] } : '',
                                            store.condicoes.obs ? {
                                                stack: [
                                                    { text: 'Observações Gerais:', bold: true, fontSize: 9, margin: [0, 4] },
                                                    { text: store.condicoes.obs, fontSize: 9, color: C.mid }
                                                ]
                                            } : ''
                                        ],
                                        margin: [10, 10, 10, 10],
                                        fillColor: C.bg
                                    }
                                ]
                            ]
                        },
                        layout: {
                            defaultBorder: false,
                            hLineWidth: () => 0.5,
                            vLineWidth: () => 0.5,
                            hLineColor: () => C.lineGray,
                            vLineColor: () => C.lineGray,
                        }
                    }
                ],
                margin: [0, 20, 0, 40]
            });
        }

        // 5. ASSINATURAS
        const signatureBlock = {
            margin: [0, 50, 0, 20],
            columns: [
                {
                    width: '*',
                    stack: [
                        { canvas: [{ type: 'line', x1: 20, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: C.lineGray }] },
                        { text: pNome, fontSize: 9, color: C.dark, bold: true, alignment: 'center', margin: [0, 8, 0, 2] },
                        { text: 'Prestador de Serviços', fontSize: 9, color: C.mid, alignment: 'center' }
                    ]
                },
                {
                    width: '*',
                    stack: [
                        { canvas: [{ type: 'line', x1: 20, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: C.lineGray }] },
                        { text: store.cliente.nome || 'Cliente / Contratante', fontSize: 9, color: C.dark, bold: true, alignment: 'center', margin: [0, 8, 0, 2] },
                        { text: 'Cliente / Contratante', fontSize: 9, color: C.mid, alignment: 'center' }
                    ]
                }
            ]
        };

        content.push(signatureBlock as Content);

        const fileName = `orcamento_${store.meta.num || '001'}_${(store.projeto.titulo || 'audiovisual').replace(/\s+/g, '_').toLowerCase()}.pdf`;

        pdfMake.createPdf(docDefinition).download(fileName);

    } catch (e) {
        console.error("Failed to generate PDF with PDFMake", e);
    }
}
