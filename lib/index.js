"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const clientsByID = new Map();
const iDsByAssetsQty = new Map();
fs_1.default.readFile("./ftx_all.csv", function read(err, data) {
    if (err) {
        throw err;
    }
    const text = data.toString().split("\r\n");
    for (const line of text) {
        const array = line.split(",");
        if (!isNaN(Number(array[0]))) {
            const id = Number(array[0]);
            if (array.length > 1) {
                array[1] = array[1].slice(1, -1);
                const assets = [];
                for (let i = 1; i < array.length; i++) {
                    const value = array[i].split("[");
                    if (value.length === 2) {
                        if (value[0].indexOf("NFT") === -1) {
                            if (value[1].indexOf("]") >= 0) {
                                value[1] = value[1].substring(0, value[1].indexOf("]"));
                            }
                            const quantity = Number(value[1]);
                            let idsByQty;
                            if (iDsByAssetsQty.has(value[0])) {
                                idsByQty = iDsByAssetsQty.get(value[0]);
                            }
                            else {
                                idsByQty = new Map();
                                iDsByAssetsQty.set(value[0], idsByQty);
                            }
                            const asset = { coin: value[0], quantity };
                            assets.push(asset);
                            if (idsByQty.has(quantity)) {
                                idsByQty.get(quantity).push(id);
                            }
                            else {
                                idsByQty.set(quantity, [id]);
                            }
                        }
                    }
                }
                clientsByID.set(id, assets);
            }
        }
    }
    foundId();
});
function checkCondition(condition, value) {
    switch (condition.type) {
        case "interval": {
            if (condition.min <= value && condition.max >= value) {
                return true;
            }
            else {
                return false;
            }
        }
        case "exact": {
            if (condition.value === value) {
                return true;
            }
            else {
                return false;
            }
        }
    }
}
function foundId() {
    const conditions = [
        { coin: "USDC", type: "interval", min: 7500, max: 7600 }
    ];
    let idsFound = [];
    let counter = 0;
    for (const condition of conditions) {
        const assetSelected = iDsByAssetsQty.get(condition.coin);
        if (assetSelected !== undefined) {
            for (const quantity of assetSelected.keys()) {
                if (counter === 0) {
                    if (checkCondition(condition, quantity)) {
                        const ids = assetSelected.get(quantity);
                        for (const id of ids) {
                            idsFound.push(id);
                        }
                    }
                }
                else {
                    if (!checkCondition(condition, quantity)) {
                        const ids = assetSelected.get(quantity);
                        for (const id of ids) {
                            const index = idsFound.indexOf(id);
                            if (index >= 0) {
                                idsFound[index] = idsFound[idsFound.length - 1];
                                idsFound.pop();
                            }
                        }
                    }
                    else {
                    }
                }
            }
        }
        counter += 1;
        console.log("ids founds: ", idsFound.length);
    }
    for (const condition of conditions) {
        const finalId = [];
        console.log(condition);
        for (const id of idsFound) {
            const client = clientsByID.get(id);
            const assets = [];
            for (const asset of client) {
                assets.push(asset.coin);
            }
            if (assets.indexOf(condition.coin) >= 0) {
                const index = idsFound.indexOf(id);
                if (index >= 0) {
                    finalId.push(id);
                }
            }
            else {
            }
        }
        idsFound = finalId;
    }
    for (const id of idsFound) {
        console.log("Possible id: ", id);
        console.log(clientsByID.get(id));
    }
    console.log("Ids found: ", idsFound.length);
}
//# sourceMappingURL=index.js.map