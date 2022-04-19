const Web3 = require("web3");
const abi = require("./abi.json");

let options = {
  clientConfig: {
    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 6000, // ms
  },

  reconnect: {
    auto: true,
    maxAttempts: 5,
    onTimeout: false,
  },
};
const webSocket =
  "wss://speedy-nodes-nyc.moralis.io/df800cc67c2b4ffd5f3e4005/bsc/testnet/ws";
const provider = new Web3.providers.WebsocketProvider(webSocket, options);
const web3 = new Web3(provider);


//In case of testing contract: testnet addr 0x11f0Fa868cAC1e0a4b2983cDa07094714719Fb8e, start from block: 18464058
const address = "0x11f0Fa868cAC1e0a4b2983cDa07094714719Fb8e";
const contract = new web3.eth.Contract(abi, address);
let eventArr = [];
let latestBlock;
let oneMonth = 0;
let threeMonth = 0;
let sixMonth = 0;
let twelveMonth = 0;

let subscribeEvents = () => {
  var subscription = web3.eth
    .subscribe("logs", {
      address: address,
      topics: [
        "0xa98fe7d2204baa1060672de0612aecc1197e5cd1fc4bb5e6f5f4b8c357052e8e",
      ],
    })
    .on("connected", async function (subscriptionId) {
      console.log(subscriptionId);
    })
    .on("data", async function (event) {
      console.log(event);

      const id = event.data.slice(0,66);
      console.log(id);
      const stakeInfo = await contract.methods.getStakeInformation(id).call();
      const stakeAmount = parseInt(stakeInfo.amount) / 10 ** 18;
      if (stakeInfo.stakingPeriod == "2592000") {
        oneMonth += stakeAmount;
      } else if (stakeInfo.stakingPeriod == "7776000") {
        threeMonth += stakeAmount;
      } else if (stakeInfo.stakingPeriod == "15552000") {
        sixMonth += stakeAmount;
      } else if (stakeInfo.stakingPeriod == "31104000") {
        twelveMonth += stakeAmount;
      }
      console.log("Total staked in 1 month staking", oneMonth);
      console.log("Total staked in 3 month staking", threeMonth);
      console.log("Total staked in 6 month staking", sixMonth);
      console.log("Total staked in 12 month staking", twelveMonth);
    })
    .on("error", function (error, receipt) {
      console.error(error);
    });
};

const getEvents = async () => {
  //Transaction block = 13652035
    latestBlock = await web3.eth.getBlockNumber();

  for (let i = 18464058; i <= latestBlock; i = i + 5000) {
    const res = await contract.getPastEvents("Staked", {
      fromBlock: i,
      toBlock: i + 5000,
    });
    eventArr.push(...res);
  }
  for (let j = 0; j < eventArr.length; j++) {
    const id = eventArr[j].returnValues.stakeId;
    const stakeInfo = await contract.methods.getStakeInformation(id).call();
    const stakeAmount = parseInt(stakeInfo.amount) / 10 ** 18;
    if (stakeInfo.stakingPeriod == "2592000") {
      oneMonth += stakeAmount;
    } else if (stakeInfo.stakingPeriod == "7776000") {
      threeMonth += stakeAmount;
    } else if (stakeInfo.stakingPeriod == "15552000") {
      sixMonth += stakeAmount;
    } else if (stakeInfo.stakingPeriod == "31104000") {
      twelveMonth += stakeAmount;
    }
  }

  subscribeEvents();

  console.log("Total staked in 1 month staking", oneMonth);
  console.log("Total staked in 3 month staking", threeMonth);
  console.log("Total staked in 6 month staking", sixMonth);
  console.log("Total staked in 12 month staking", twelveMonth);
};

getEvents();
