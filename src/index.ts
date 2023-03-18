import fs from "fs";
const clientsByID = new Map<number,Asset[]>();
const iDsByAssetsQty = new Map<string,IdsByQty>(); 
fs.readFile("./ftx_all.csv", function read(err, data) {
    if (err) {
        throw err;
    }
    const text = data.toString().split("\r\n");
    // console.log(text);
    for(const line of text){
        const array = line.split(",");
        if(!isNaN(Number(array[0]))){
            // console.log(array);
            const id = Number(array[0]);
            if(array.length > 1){
                array[1] = array[1].slice(1,-1);
                const assets = [];
                for(let i = 1; i < array.length; i++){
                    const value = array[i].split("[");
                    if(value.length ===2){
                        if(value[0].indexOf("NFT") === -1){
                            // const idsByQty = new Map<number,number[]>(); //First qty, second ID;
                            // console.log(value);
                            if(value[1].indexOf("]") >=0){
                                value[1] = value[1].substring(0,value[1].indexOf("]"));
                            }
                            const quantity = Number(value[1]);
                            let idsByQty:IdsByQty; //First qty, second ID;
                            if(iDsByAssetsQty.has(value[0])){
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                idsByQty = iDsByAssetsQty.get(value[0])!;
                            } else {
                                idsByQty = new Map<number,number[]>();
                                iDsByAssetsQty.set(value[0],idsByQty);
                            }
                            const asset:Asset = {coin:value[0],quantity};
                            assets.push(asset);
                            if(idsByQty.has(quantity)){
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                idsByQty.get(quantity)!.push(id);
                            } else{
                                idsByQty.set(quantity,[id]);
                            }
                            // console.log(value);
                        }
                    }
                    // value[1] = value[1].substring(0,value[1].indexOf("]"));
                    // // if(value)
                    // console.log(value);
                }
                clientsByID.set(id,assets);
            }
        }
    }
    foundId();
    // console.log(clientsByID.get(idFounded[0]));
    // console.log(data.toString());
});
type Asset = {
    coin:string,
    quantity:number
}
function checkCondition(condition:Condition,value:number):boolean{
    switch(condition.type){
        case "interval":{
            if(condition.min<= value && condition.max >= value){
                return true;
            } else {
                return false;
            }
        }
        case "exact":{
            if(condition.value === value){
                return true;
            } else {
                return false;
            }
        }
    }
}


function foundId(){
    const conditions:Condition[] = [
        { coin: "USDC", type: "interval",min:7500,max:7600}
    ];
    // const condition:ExactCondition = { coin: "SOL", type: "exact",value:0.9065};
    let idsFound:number[] = [];
    let counter  =0;
    for(const condition of conditions){

        const assetSelected = iDsByAssetsQty.get(condition.coin);
        // console.log("Selected: ",assetSelected);
        if(assetSelected !== undefined){
            for(const quantity of assetSelected.keys()){
                if(counter === 0){
                    if(checkCondition(condition,quantity)){
                        const ids = assetSelected.get(quantity);
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        for(const id of ids!){
                            idsFound.push(id);
                            // console.log(id);
                        }
                    }
                } else {
                    if(!checkCondition(condition,quantity)){
                        const ids = assetSelected.get(quantity);
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        for(const id of ids!){
                            const index = idsFound.indexOf(id);
                            if(index >=0){
                                idsFound[index] = idsFound[idsFound.length-1];
                                idsFound.pop();
                            }
                        }
                    } else {
                        // console.log("Cumple: ",condition,quantity);
                        // const ids = assetSelected.get(quantity);
                        // console.log(ids);
                    }
                }
            }
        }
        counter +=1;
        console.log("ids founds: ",idsFound.length
        );
    }

    for(const condition of conditions){
        const finalId:number[] = [];
        console.log(condition);
        for (const id of idsFound) {
            const client = clientsByID.get(id);
            const assets = [];
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            for(const asset of client!) {
                assets.push(asset.coin);
            }
            if(assets.indexOf(condition.coin) >= 0){
                const index = idsFound.indexOf(id);
                if(index >= 0){
                    finalId.push(id);
                }
            } else {
                // if(condition.coin === "SOL"){
                //     console.log("Saving client: ",client);
                //     console.log(assets.indexOf(condition.coin));
                //     console.log(condition);
                // }
            }
        }
        idsFound = finalId;
    }
    for(const id of idsFound){
        console.log("Possible id: ",id);
        console.log(clientsByID.get(id));
    }
    console.log("Ids found: ",idsFound.length);
}

type IdsByQty = Map<number,number[]>;
type Condition = IntervalCondition|ExactCondition;
type IntervalCondition = {coin:string,type:"interval",min:number,max:number};
type ExactCondition = {coin:string,type:"exact",value:number};