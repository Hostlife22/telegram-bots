interface VideoItem {
  code: string;
  name: string;
}

const videos: VideoItem[] = [
  { code: "invest", name: "Make $5,000+ with Pinterest" },
  { code: "", name: "Crypto Security Upgraded" },
  { code: "", name: "Crypto Security Upgraded / Part 2" },
  { code: "curve", name: "Ear $100+per Day in Telegram" },
  { code: "", name: "Revolutionizing Investments" },
  {
    code: "lachesis",
    name: "Spot The Next 100X Altcoin | Guide For Beginners",
  },
  { code: "", name: "Revolutionizing Investments | Part 2" },
  { code: "liquids", name: "Start Your Business Under $100" },
  { code: "", name: "Blockchain Speed Showdown 1" },
  { code: "mainnet", name: "10 Habits of Millionaires" },
  { code: "", name: "Blockchain Speed Showdown 2)" },
  { code: "quorum", name: "Make $755 While You Sleep" },
  { code: "", name: "Staking in 2024" },
  { code: "perpetual", name: "10 Best Dropshipping Niches" },
  { code: "scam", name: "Sell Your Photos for $5 per One" },
  { code: "5UY4W1", name: "TapSwap Education. Part 2" },
  { code: "J386XS", name: "TapSwap Education. Part 1" },
  { code: "5L32DN", name: "Cool News!" },
  { code: "ledger", name: "Make $30 Per Word With Typing" },
  { code: "5FR63U", name: "Hot news!" },
  { code: "fakeout", name: "How To Make Money on STOCKS" },
  { code: "PD9S6HN81M", name: "Bitcoin Update: Mt. Gox Payouts" },
  { code: "payout", name: "How To Create Your OWN COIN?" },
  { code: "nominators", name: "You Will LOSE Money -Don't DO IT" },
  { code: "J9RO8", name: "Why Are People Going Crazy for NFTs? | Part 2" },
  { code: "raiden", name: "Earn Money For Listening To Music" },
  { code: "2NV4Z", name: "Why Are People Going Crazy for NFTs?" },
  { code: "scaling", name: "Get Paid +$750 EVERY 20 Minutes Online" },
  { code: "1T75S7", name: "TapSwap Internal News" },
  { code: "keylogger", name: "10 Websites That Will Pay You" },
  { code: "9SX634", name: "Blockchain Secrets Part 2" },
  { code: "rebalancing", name: "You Will LOSE Your Money" },
  { code: "2V3L5", name: "Blockchain Secrets" },
  { code: "inflation", name: "Crypto Bots are SCAMMING you!" },
  { code: "timelock", name: "How To Farm 1 MILLION Coins In TapSwap" },
  { code: "8NL6FW9", name: "TON Ecosystem Alert" },
  { code: "royalties", name: "Make $5,000 per a Month" },
  { code: "7L6PB", name: "Crypto news Part 2" },
  { code: "backlog", name: "Make $500 A Day" },
  { code: "1MH89S", name: "Crypto news!" },
  { code: "immutable", name: 'Earn $2000+ Watching - "Youtube"' },
  { code: "electrum", name: "Where To Start in Crypto" },
  { code: "YK797", name: "Bitcoin halving | Part 2" },
  { code: "flashbots", name: "20 Best YouTube Niche In 2024" },
  { code: "", name: "Maximize Your Impact" },
  { code: "capital", name: "5 REAL Apps That Pay You To Walk" },
  { code: "", name: "Key Steps to Safe Crypto Investments" },
  { code: "node", name: "10 Best Budgeting Apps for 2024" },
  { code: "long", name: "Video title: 15 Powerful Secrets to Get Rich Sooner" },
  { code: "", name: "Stay Anonymous in Crypto" },
  { code: "", name: "Boosting Ethereum's Speed and Efficiency | part 2" },
  { code: "libp2p", name: "Avoid This To Become Rich" },
  { code: "jager", name: "Earn $300/Daily from Binance App Without Risk" },
  { code: "monopoly", name: "Make Money Playing video games" },
  { code: "", name: "The role of market cap in crypto investments" },
  { code: "gwei", name: "7 Best Cash Back Apps on Your Purchases" },
  { code: "dumping", name: "Earn $50 Per Survey + Instant Payment!" },
  { code: "custody", name: "Best High Paying Micro-Task Job Websites" },
  { code: "moon", name: "Top 3 Skills To Make Your First $100,000" },
  { code: "taint", name: "How I Manage My Time - 15 Time Management Tips" },
  { code: "", name: "Tappy Town Guide: Gems, Blocks and builders | Part 1" },
  { code: "money", name: "5 Ways To Make REAL MONEY before 2025" },
  { code: "", name: "Don't Get Hacked | Part 2" },
  { code: "fakeout", name: "Earn $500 Per Day by Reviewing Products" },
  { code: "newb", name: "Easiest $5,000 Per Month With Chat GPT" },
  { code: "network", name: "5 Lazy Ways to Make Money Online(Passive Income)" },
  { code: "bag", name: "Top 10 Jobs That Let You Travel The World" },
  { code: "pair", name: "Reselling In 2024 (EASY $10,000)" },
  { code: "taint", name: "15 Time Management Tips" },
  { code: "money", name: "Make REAL MONEY before 2025" },
  { code: "airnode", name: "TapSwap UPDATE" },
  { code: "payee", name: "Make $10,000 In The TikTok!" },
  { code: "protocol", name: "Top Free Finance Courses" },
  {
    code: "dyor",
    name: "Make Money Managing Social Media Accounts for Companies",
  },
  {
    code: "scamcoin",
    name: "Top Future Professions: What Pays Well and What Won't Survive",
  },
  {
    code: "liquidity",
    name: "Phone-Based Side Hustles",
  },
  {
    code: "platform",
    name: "10 Laziest Ways to Make Money Online",
  },
  {
    code: "phishing",
    name: "Monetize Your Blog!",
  },
  {
    code: "peg",
    name: "Earning with Affiliate Programs",
  },
  {
    code: "address",
    name: "How to Earn Free Bitcoin Without Any Investment",
  },
  {
    code: "platform",
    name: "10 Laziest Ways to Make Money Online",
  },
  {
    code: "hacking",
    name: "How To Start Earning With Airbnb?",
  },
  {
    code: "geth",
    name: "How To Monetize Any Hobby or Passion",
  },
  {
    code: "rekt",
    name: "Simple Earning On Binance",
  },
  {
    code: "roadmap",
    name: "Open Best Online Businesses!",
  },
  {
    code: "abstract",
    name: "Make $5000 In A Month On X",
  },
  {
    code: "account",
    name: "Make money from Instagram",
  },
  {
    code: "affiliate",
    name: "I Asked Comanies For FREE Stuff",
  },
  {
    code: "oversold",
    name: "Make Money With Your Car!",
  },
  {
    code: "honeypot",
    name: "Millionaire-Making Crypto Exchanges!",
  },
  {
    code: "rebase",
    name: "Get Free Gifts Using Loyalty Programs",
  },
  {
    code: "abstract",
    name: "Make $5000 In A Month On X",
  },
  {
    code: "roadmap",
    name: "Open Best Online Businesses!",
  },
  {
    code: "rekt",
    name: "Simple Earning On Binance",
  },
  {
    code: "gas",
    name: "Make $5000+ With Copy Trading",
  },
  {
    code: "whitepaper",
    name: "Make Big Money In Small Towns",
  },
  {
    code: "whitelist",
    name: "Make $1000 Per Day",
  },
  {
    code: "whale",
    name: "Be Productive Working From Home",
  },
  {
    code: "regens",
    name: "The Best Side Hustles Ideas!",
  },
  {
    code: "wallet",
    name: "Get Paid To Playtest",
  },
  { code: "wei", name: "Selling Your Art Online!" },
  { code: "volume", name: "Famous Crypto Millionaires" },
  { code: "volatility", name: "Facebook Ads Tutorial" },
  { code: "virus", name: "Start A Profitable Youtube Channel!" },
  { code: "vaporware", name: "Amazon Success!" },
  { code: "validator", name: "Stay Out Of Poverty!" },
  { code: "rust", name: "Amazon Success 2" },
  { code: "restaking", name: "Make Money Anywhere" },
  { code: "retargeting", name: "Save Your First $10,000" },
  { code: "whitepaper", name: "Online Business From $0" },
  { code: "regulated", name: "Watch To Get Rich!" },
  { code: "accrue", name: "Achieve Everything You Want" },
  { code: "honeyminer", name: "Anyone Can Get Rich!" },
  { code: "zksharding", name: "Secrets To Secure Business Funding" },
  { code: "zkoracle", name: "Work From Home" },
  { code: "zkapps", name: "Make Money As A Student" },
  { code: "regens", name: "The Best Side Hustles Ideas!" },
  { code: "taproot", name: "How To Retire Early" },

  { code: "tangle", name: "They Changed Our Lives" },
  { code: "shard", name: "Make $3,000 Per Month By Selling" },
  { code: "settlement", name: "$5,000 Month Flipping Items On ebay" },
  { code: "security", name: "Telegram Wallet 2024" },
  { code: "scrypt", name: "Make Money On Weekends" },
];

const Fuse = require("fuse.js");

export const getCode = async (name: string): Promise<string | undefined> => {
  const fuse = new Fuse(videos, {
    keys: ["name"],
    threshold: 0.3,
  });
  const result = fuse.search(name);
  return result.length > 0 ? result[0].item.code : undefined;
};