import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const registerConnectionHandlers = () => {
    mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    });
};

const buildExplicitAtlasUri = (mongoUri) => {
    if (!mongoUri || !mongoUri.startsWith('mongodb+srv://')) {
        return null;
    }

    try {
        const parsed = new URL(mongoUri);
        const [clusterName, clusterId] = parsed.hostname.split('.');

        if (!clusterName || !clusterId) {
            return null;
        }

        const hosts = [
            `${clusterName}-shard-00-00.${clusterId}.mongodb.net:27017`,
            `${clusterName}-shard-00-01.${clusterId}.mongodb.net:27017`,
            `${clusterName}-shard-00-02.${clusterId}.mongodb.net:27017`
        ].join(',');

        const pathname = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/';
        const query = new URLSearchParams(parsed.search);

        if (!query.has('authSource')) query.set('authSource', 'admin');
        if (!query.has('replicaSet')) query.set('replicaSet', 'atlas-95d0ac-shard-0');
        if (!query.has('retryWrites')) query.set('retryWrites', 'true');
        if (!query.has('w')) query.set('w', 'majority');
        if (!query.has('tls')) query.set('tls', 'true');

        return `mongodb://${parsed.username}:${parsed.password}@${hosts}${pathname}?${query.toString()}`;
    } catch (error) {
        console.error(`Failed to build MongoDB fallback URI: ${error.message}`);
        return null;
    }
};

const connectWithFallback = async (mongoUri) => {
    try {
        return await mongoose.connect(mongoUri);
    } catch (error) {
        const isSrvLookupFailure =
            error?.message?.includes('querySrv ECONNREFUSED') ||
            error?.message?.includes('querySrv ENOTFOUND');
        const fallbackUri = isSrvLookupFailure ? buildExplicitAtlasUri(mongoUri) : null;

        if (!fallbackUri) {
            throw error;
        }

        console.warn('MongoDB SRV lookup failed, retrying with explicit Atlas hosts...');
        return mongoose.connect(fallbackUri);
    }
};

const connectDB = async () => {
    try {
        const conn = await connectWithFallback(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
