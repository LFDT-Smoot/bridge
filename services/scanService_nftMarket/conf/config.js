
const config = {
  "mongoUrl": "mongodb://172.17.0.1:27017/stellar_eea_scanService",
  "webPort": 9001,
  "XLM":{
    "horizonUrl": "https://horizon-testnet.stellar.org/",
    "__horizonUrl": "http://34.214.40.196:8000/",
    "scanIntervalMs": 5000,
    "beginScanBlockNumber": 714700,
    "safeBlock" : 1,
    "nftMarketAddr": "CAXXHQQ2SFBI3UGVXO3Y3YAHG2VZIC6X6ZEVSVSB3RGFTKSYQHR2PXU6",
    "nftContractAddr": "CBE3RST7FUEDGCZDZZRJNQCPP2C5S45GX2D4OFXEO4WXZN2WKOVIWHJA",
    "gatewayAddr": "CCXQ766VQ66F4F2FVBLF4UWX34ALKWPNYYM6X4TENERUKMMO5BB3S6HD"
  },
  "MATIC":{
    "nodeUrl": "https://rpc-amoy.polygon.technology",
    "scanIntervalMs": 2000,
    "beginScanBlockNumber": 26862000,
    "safeBlock" : 1,
    "nftMarketAddr": "0x7349B7e4baea99d499DEFC0B41f88500630e781A",
    "nftMarketAbi": require('./abi/abi.NftMarket.json'),
    "gatewayAddr": "0xA51F41C8e1d6062222fcb711D5eDC7cB3c3395c4",
    "gatewayAbi": require("./abi/abi.gateway.json")
  },
  "scanedInfoTbl": "scanedInfoTbl",
  "orderInfoTbl": "orderInfoTbl",
  "nftInfoTable": "nftInfoTable",
  "orderStatus": {
    status_listing: "listing",
    status_onsale: "onsale",
    status_canceling: "canceling",
    status_canceled: "canceled",
    status_successed: "success"
  },
  nftMetadatas:{
    90001: {
      name: 'Golden Metropolis',
      description: `In a gleaming cityscape where the boundaries of reality blur, a golden metropolis towers against a teal sky, its mirrored reflection creating a portal to a dreamlike world. Geometric shapes and floating clouds hint at an existence suspended between fantasy and the surreal, a city both familiar and otherworldly.`
    },
    90002: {
      name: "Fiery Silhouette",
      description: `A lone figure stands at the edge of transformation, emerging from a vibrant inferno of reds and oranges. This silhouette wrestles with inner turmoil, caught in a moment of metamorphosis where fire becomes a force of renewal and rebirth.●"The Forest" - Beneath a darkened canopy of towering trees, a mysterious path winds through a dense, monochromatic forest. Golden light filters through from a distant sky, marking either the beginning or end of a journey through this eerie and secluded woodland.`
    },
    90003: {
      name: "The Forest",
      description: `Beneath a darkened canopy of towering trees, a mysterious path winds through a dense, monochromatic forest. Golden light filters through from a distant sky, marking either the beginning or end of a journey through this eerie and secluded woodland.`
    },
    90004: {
      name: 'City Collage',
      description: `A colorful, abstract representation of a city skyline created through a collage technique. Various geometric shapes in different colors and patterns are arranged to form buildings of different heights. The overall effect is playful and vibrant, with a large orange circle representing the sun in the upper left corner.`
    },

    90005: {
      name:"The Gates",
      description: `A majestic bronze panel stands as a portal to a golden, illuminated interior. Intricate human figures in classical relief suggest ancient tales and timeless stories, echoing the grand artistry of Renaissance masterpieces like Ghiberti’s Gates of Paradise`
    },
    90006: {
      name :"Pathway",
      description: `This digital artwork depicts a solitary figure walking on a wooden path through a surreal, cosmic landscape. The sky is filled with vibrant colors, from deep blues to fiery oranges, and countless points of light resembling stars. Vertical lines of light stretch from the ground to the sky, creating a magical, otherworldly atmosphere.`
    },
    90007: {
      name: "Time Spiral",
      description: `This sepia-toned digital image shows a man's silhouette standing before a large spiral structure. The man stands before this  monumental spiral of architecture, a vast cityscape stretching into infinity. The spiral, representing the cyclical nature of time and progress, draws him into its depths, suggesting an endless journey through the evolving landscape of human creation.`
    },
    90008: {
      name: "Bread of Life",
      description: `In a barren, desolate world, a hand emerges from the dry earth, holding a slice of bread. Against the backdrop of a dramatic sunset, this surreal image contrasts nourishment with desolation, reflecting themes of survival and the fragility of life in a harsh environment.`
    },

    90009: {
      name: "The Human Wheel",
      description: `Another intricate bronze sculpture depicts the eternal cycle of human existence. With scenes of life and figures etched into the outer ring, and a golden central figure, this artwork captures the profound interconnectedness of humanity's stories across time.`
    },
    90010: {
      name: "The Scholar",
      description: `A green-skinned alien scholar stands in an academic setting, poring over an ancient book. With its glasses and robes, this alien character suggests a vast intergalactic knowledge, blending familiar scholarly imagery with a sense of the fantastical.`
    },
    500011: {
      name: "Cloudscape",
      description: `This image shows a fantastical landscape with large, soft cloud-like structures in pastel colors. In the foreground, there's an explosion or eruption of colorful matter, reminiscent of a stylized atomic blast or volcanic eruption. Spherical objects of various sizes float in the air. Two small human figures stand in the foreground, providing scale to the massive forms around them.`
    },
    500012: {
      name: "Coral City Island",
      description: `A surreal cityscape rises from a coral-like base on a sandy beach, where colorful buildings reach skyward. Above, majestic creatures like whales glide through the sky, adding to the dreamlike quality of this island city caught between land and sea.`
    },

    500013: {
      name: "The Botanist",
      description: `Surrounded by strange, pink, flower-like plants, a studious botanist examines the secrets of life. With intricate features and scientific attire, the character brings an air of curiosity and research to an alien world filled with natural wonders.`
    },
    500014: {
      name: "The Alchemist",
      description: `A brilliant researcher, clad in a steampunk helmet with tubes and lenses, stands amidst an array of scientific equipment. This alchemist explores the boundaries between magic and science, seeking the hidden truths of a fantastical world through meticulous study.`
    }
  }
};

module.exports = config;
