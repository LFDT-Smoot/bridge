let config = {
    user1:{   //use as nft_admin
        PublicKey:"GDDCPCUQVR3SOCQO24FDLG3OQKT3DZRBFTQB7CS7ZP2PN4RUG6EKXODP",
        secret:"... YOUR PRIVATE KET STRING..."
    },
    user2: {
        PublicKey: 	"GAZ7L2FXGOK5QZS3S2ZJUJMIEMFIZH4ZBDIZY6LEFHZ3HDEFCE6NBKQK",
        secret:	 "... YOUR PRIVATE KET STRING..."
    },
    user3: {
        PublicKey:  "GDH2EJSEBJNTIDYACUSZ3GIAQOTIMPZFXDR64S43FABLA2NOVJSA33H4",
        secret:	 "... YOUR PRIVATE KET STRING..."
    },
    horizon_testUrl:"https://horizon-testnet.stellar.org/",
    soroban_testUrl:"https://soroban-testnet.stellar.org",
    scAddr: {
        nft:"CB6SZVUAFKBOSWNRD3SQ4S42DT7UN5OJ3WIAXPELZ7TNNQL444EOVKIJ",
        nft_market:"CD4JGLM2CLVI6B6LQ4ZWY2XSPGC6SU5PJHVXAHUTL2MRH4GTE2JXU36O",
        //message_bridge:"CB2H4YDRDJR5BQEYGT76VVJH2FXA54AB6ZWCVX5OVVTVUAVCII7HVGHB", //
        message_bridge: "CBKMVI6XU7AQ4VS3OCLT2JYLOQN5Y3V2PABFKXI7LLCNC327MGQAD7ZA", //
    },
    peerEvm:{
        chainId: 2147484614,   //matic
        scAddr:'B9b35117b4d0124C893f9505F5a3C9e69144a3e2'   // peer evm - NftMarket address: 0xB9b35117b4d0124C893f9505F5a3C9e69144a3e2
    },
    cur_nft_id:50001,
    secp256k1:{
        user1:{
            privKey:"...YOUR PRIVATE KEY string",
            pubKey: [
                4, 166,  17, 110,  93, 128, 128,  83, 169,  72, 244,
                250, 172,  27, 134,   4, 157,   4, 131, 178,  34, 246,
                247, 214,  38, 157,  31, 191, 219,  59,  30, 108,  63,
                130, 208, 192, 188, 133, 114,  29, 102, 217, 216,  39,
                77, 108, 136, 122,  69, 164,  63,  64,  65, 108,  61,
                108, 150, 113,  71,  89,  58, 186, 132, 171,   4
            ],
        },
        user2:{
            privKey:"...YOUR PRIVATE KEY string",
            pubKey:[
                4,  97, 241, 240,  68,  40, 184, 162, 123, 147,  41,
                229,  71,   3, 155, 253,  59, 122,  99,   6,  61,  43,
                64, 209,  54,   5, 239, 155,  14,  15, 191,  81, 153,
                15, 239, 117, 246, 247,   5, 248,  12, 168,   0, 103,
                200, 143, 150,  88, 208,  87, 232, 205, 106,  90, 152,
                108, 103, 205,   5,  67,  38,  72, 249, 118,  16
            ]
        },
        user3:{
            privKey:"...YOUR PRIVATE KEY string",
            pubKey:[
                4,  16,  91, 137,  20, 139, 241, 189, 252, 101, 104,
                177, 128, 146,  11,  19, 223, 170, 210,  49, 171, 153,
                157,  10, 228,  14,  64,  74, 184, 242, 169, 244, 114,
                153, 230, 236, 108, 139, 210, 198, 222,  63, 108, 119,
                43, 153, 131, 152, 102,  94,  64, 192, 217,   8, 115,
                136,  97, 203,  56, 150, 210, 107, 176,  64, 190
            ]
        },
        user4:{
            privKey:"...YOUR PRIVATE KEY string",
            pubKey:[
                4, 202,  89,  49,  84, 221,  54,   9, 176,  20,  55,
                23,  91, 233,  10,  90, 218, 129, 186,  58, 221, 188,
                129, 145, 110,  18,  95, 194,  86, 128, 249,  12,  75,
                102,  41, 220, 208,  61,   5, 122, 144, 133,  37,  57,
                67,  56,   1, 196, 176, 221, 154,  24,  43, 119, 137,
                127, 152, 182,  20,   6,  81,  74,  85, 245, 124
            ]
        },
        user5:{
            privKey:"...YOUR PRIVATE KEY string",
            pubKey: [
                4, 162,  59,  62,  11,  98, 215, 195, 161,  20,  34,
                184, 187,  41,  58, 232, 253,   2,  57, 194,  82, 115,
                25,   1, 203, 116, 237, 213, 165, 167, 132, 245,  81,
                118, 133,  20,  39,  11,  70,  76, 231, 142, 237,  23,
                148,  19,  81,  71, 204,   2, 164, 204, 198,   4, 104,
                252, 125,  52,  53, 167, 205, 242,  66, 203,  54
            ]
        }

    },
    testPubKey : [
        "046ef704ec6aabaab156abe9eec3581667ccdcef2794312a70f1f8180181b67a114704052adf3b21af01f5e84114f7234c2f798215e04d15ad226f799c51677e92",
        "04ee2ebdb64f385a03a96ab6d7771e42fd4dd05bcd789ac12fe6a10ba6bdde68f9ed8dc460726496ab7042e37bbb64bc023f83603b47569973d98fb1ba71dda4f7",
        "04e73f94031d7dcbe3177dd193246f82af4a53637ae07b13c0a6c1f94194dc28e5d7d318393af07f593107469b78e870c35543fdadcda37e6d936bc0a368d6098d",
    ]
}

module.exports = config

