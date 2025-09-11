import admin from 'firebase-admin';
import serviceAccount from '../config/presencify-FCM-sdk-private-key.json' with { type: 'json' };
import StudentFCMToken from '../db/models/studentFCMToken.model.js';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})


const sendNotification = async (fcmToken, title, body, data) => {
    const message = {
        notification: {
            title,
            body
        },
        data: data,
        token: fcmToken
    };
    console.log(message)
    try {
        const response = await admin.messaging().send(message);
        console.log('Notification sent:', response);
    } catch (error) {
        // if not registered means app is unintalled (bcz if the token had change then the app would have sent the updated token)
        if (error.errorInfo.code === 'messaging/invalid-argument') {
            await StudentFCMToken.destroy({
                where: {
                    fcmToken: fcmToken
                }
            })
            console.log('Token not registered (hence removed from db):', error.errorInfo.code);
        }
        console.error('Error sending notification:', error);
    }
};

export { admin, sendNotification }