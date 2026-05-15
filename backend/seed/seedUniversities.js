require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const University = require('../models/University');

const universities = [
    { name: "University of Colombo", aliases: ["Colombo", "UOC"], latitude: 6.9000, longitude: 79.8598 },
    { name: "University of Peradeniya", aliases: ["Peradeniya", "Pera", "UOP"], latitude: 7.2544, longitude: 80.5971 },
    { name: "University of Moratuwa", aliases: ["Moratuwa", "Mora", "UOM"], latitude: 6.7969, longitude: 79.9018 },
    { name: "University of Kelaniya", aliases: ["Kelaniya", "UOK"], latitude: 6.9739, longitude: 79.9158 },
    { name: "University of Sri Jayewardenepura", aliases: ["Sri Jayewardenepura", "Jayawardenapura", "Japura", "USJ"], latitude: 6.8528, longitude: 79.9036 },
    { name: "University of Ruhuna", aliases: ["Ruhuna", "UOR"], latitude: 5.9381, longitude: 80.5760 },
    { name: "University of Jaffna", aliases: ["Jaffna", "UOJ"], latitude: 9.6849, longitude: 80.0219 },
    { name: "Rajarata University of Sri Lanka", aliases: ["Rajarata", "RUSL"], latitude: 8.3614, longitude: 80.5050 },
    { name: "Wayamba University of Sri Lanka", aliases: ["Wayamba", "WUSL"], latitude: 7.3204, longitude: 80.0000 },
    { name: "Sabaragamuwa University of Sri Lanka", aliases: ["Sabaragamuwa", "SUSL"], latitude: 6.7146, longitude: 80.7872 },
    { name: "South Eastern University of Sri Lanka", aliases: ["South Eastern", "SEUSL"], latitude: 7.2974, longitude: 81.8500 },
    { name: "Eastern University, Sri Lanka", aliases: ["Eastern", "EUSL"], latitude: 7.7981, longitude: 81.5763 },
    { name: "Uva Wellassa University", aliases: ["Uva Wellassa", "UWU"], latitude: 6.9819, longitude: 81.0763 },
    { name: "General Sir John Kotelawala Defence University", aliases: ["Kotelawala", "KDU"], latitude: 6.8188, longitude: 79.8894 },
    { name: "University of the Visual and Performing Arts", aliases: ["UVPA", "Visual and Performing Arts"], latitude: 6.9054, longitude: 79.8687 },
    { name: "Gampaha Wickramarachchi University of Indigenous Medicine", aliases: ["Gampaha Wickramarachchi", "GWUIM"], latitude: 7.0864, longitude: 80.0053 },
    { name: "University of Vavuniya", aliases: ["Vavuniya", "UOV"], latitude: 8.7514, longitude: 80.4971 },
    { name: "Open University of Sri Lanka", aliases: ["Open University", "OUSL"], latitude: 6.8833, longitude: 79.8833 },
    { name: "Sri Lanka Institute of Information Technology", aliases: ["SLIIT", "Malabe"], latitude: 6.9147, longitude: 79.9733 },
    { name: "NSBM Green University", aliases: ["NSBM", "Green University"], latitude: 6.8211, longitude: 80.0399 },
    { name: "Sri Lanka Technological Campus", aliases: ["SLTC"], latitude: 6.8532, longitude: 80.0632 },
    { name: "CINEC Campus", aliases: ["CINEC"], latitude: 6.9142, longitude: 79.9575 },
    { name: "Horizon Campus", aliases: ["Horizon"], latitude: 6.9100, longitude: 79.9702 },
    { name: "Informatics Institute of Technology", aliases: ["IIT"], latitude: 6.8785, longitude: 79.8580 },
    { name: "Asia Pacific Institute of Information Technology", aliases: ["APIIT"], latitude: 6.9113, longitude: 79.8587 },
    { name: "ICBT Campus", aliases: ["ICBT"], latitude: 6.8906, longitude: 79.8540 },
    { name: "National Institute of Business Management", aliases: ["NIBM"], latitude: 6.9042, longitude: 79.8694 },
    { name: "Saegis Campus", aliases: ["Saegis"], latitude: 6.8624, longitude: 79.8974 },
    { name: "Royal Institute of Colombo", aliases: ["RIC", "Royal Institute"], latitude: 6.8839, longitude: 79.8654 },
    { name: "Ocean University of Sri Lanka", aliases: ["Ocean University", "OCUSL"], latitude: 6.8361, longitude: 79.8828 },
    { name: "Aquinas College of Higher Studies", aliases: ["Aquinas"], latitude: 6.9208, longitude: 79.8781 }
];

async function seedUniversities() {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in .env file");
        }
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB Connected for Seeding");

        // Use findOneAndUpdate to preserve existing _ids
        for (const uni of universities) {
            await University.findOneAndUpdate(
                { name: uni.name },
                { $set: uni },
                { upsert: true, new: true }
            );
            console.log(`Upserted ${uni.name}`);
        }

        console.log("University seeding completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding universities:", error);
        process.exit(1);
    }
}

seedUniversities();
