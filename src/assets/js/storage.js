// Generate global universal identifier
// eg. a9f1a84e-5892-0313-1bde-7703f53e6c31
let guid = () => {
    let s = () => {
        return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
    };

    return `${s()}${s()}-${s()}-${s()}-${s()}-${s()}${s()}${s()}`;
};

let defaultStorage = {
    guid: guid(),
    style: 'MLA'
};

Object.keys(defaultStorage).forEach(key => {
    if(typeof localStorage[key] === 'undefined') localStorage[key] = defaultStorage[key];
});

console.log('FlatCal is open source: https://github.com/christianjuth/flatcal');