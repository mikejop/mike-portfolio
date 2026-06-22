import Fuse from 'fuse.js';
import { predefinedEquipments } from './src/features/tools/pricing-editor/data/predefinedEquipments';

const fuse = new Fuse(predefinedEquipments, {
    keys: [
        { name: 'name', weight: 0.6 },
        { name: 'category', weight: 0.2 },
        { name: 'spec', weight: 0.2 }
    ],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true
});

const results = fuse.search('FeelWorld LUT');
console.log(`Found ${results.length} results for 'FeelWorld LUT'.`);
if (results.length > 0) {
    console.log(results.slice(0, 3).map(r => r.item.name));
} else {
    console.log("No results!");
}
