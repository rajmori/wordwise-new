// Debug middleware to log request body
export const logRequestBody = (req, res, next) => {
    console.log('\n=== INCOMING REQUEST ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('========================\n');
    next();
};
