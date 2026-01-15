const admin = require("firebase-admin")
const serviceAcoount = require("./firebaseKey.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAcoount),
})

const db = admin.firestore()

module.exports =db