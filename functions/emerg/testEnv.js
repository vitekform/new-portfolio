export async function onRequest({ env }) {
    throw new Error("Env values: SENDGRID_API_KEY, " + env.SENDGRID_API_KEY);
}