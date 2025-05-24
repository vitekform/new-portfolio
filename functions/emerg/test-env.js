export async function onRequest(context) {
    throw new Error("Env values: SENDGRID_API_KEY, " + process.env.SENDGRID_API_KEY);
}