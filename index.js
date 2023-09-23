const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const json2csv = require('@json2csv/plainjs');
const {writeFile} = require("fs");

const db = admin.firestore();
const initHealth = async () => {
    const collection = db.collection('services');

// Obtenemos todos los documentos de la colección
    const snapshot = await collection.orderBy('timestampRegister','asc').get();




    const docs = snapshot.docs.map(async (doc) => {
        const serviceData = doc.data();
        const health = await getStatusService(serviceData.service, serviceData.initDate, serviceData.endDate);
        return { service: serviceData.service, initDate: serviceData.initDate.toDate().toISOString(), endDate: serviceData.endDate.toDate().toISOString(), availabilityService: serviceData.availability,...health};
    });


    const results = await Promise.all(docs);
    //console.log(results);
//
// Convertimos el objeto JSON a un archivo CSV
    const parser = new json2csv.Parser();
    const csvData = parser.parse(results);

    writeFile('health.csv', csvData, 'utf8', function(err) {
        if (err) {
            console.log('Some error occured - file either not saved or corrupted file saved.');
        } else {
            console.log('It\'s saved!');
        }
    });
}

initHealth()

const getStatusService = async (service, initDate, endDate) => {
    const healthRef = db.collection('health');
    const snapshot = await healthRef.where('source', "==", service).where("time",">", initDate).where("time", "<",endDate).get();
    const docs = snapshot.docs.map(doc => doc.data());
    const groupedHealth = docs.reduce((acc, health) => {
        const category = health.instance;

        if (!acc[category]) {
            acc[category] = [];
        }

        acc[category].push(health);

        return acc;
    }, {});
    const keys = Object.keys(groupedHealth);
    let results = [];
    for (const key of keys) {
        const errorHealth = groupedHealth[key].filter((item) => item.health === 'down');
        const instanceAvailability = (groupedHealth[key].length - errorHealth.length) / groupedHealth[key].length;
        results.push({ availability: instanceAvailability});
    }
    let availability = results.reduce((a, b) => a + b.availability, 0);
    availability = availability/ results.length;
    return { availability}
}
