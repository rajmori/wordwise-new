// Course Video Data
// Note: Replace these URLs with actual GCP bucket signed URLs in production

export const courseData = {
    courseTitle: "Advanced Vocabulary Mastery Course",
    courseDescription: "Master advanced vocabulary with our comprehensive video series featuring etymology, mnemonics, and practical usage examples.",
    instructor: "WordWise Team",
    totalDuration: "2h 45m",

    videos: [
        {
            id: 1,
            title: "Introduction to Etymology",
            description: "Learn the fundamentals of word origins and how understanding etymology can dramatically improve your vocabulary retention.",
            duration: "15:30",
            // Actual GCP bucket URL
            videoUrl: "https://storage.googleapis.com/intro12/intro/Screen_Recording_20250617_001903_Samsung%20Notes.mp4",
            thumbnail: "https://via.placeholder.com/320x180/6366f1/ffffff?text=Lesson+1"
        },
        {
            id: 2,
            title: "Memory Techniques for Vocabulary",
            description: "Discover powerful mnemonic devices and memory palace techniques specifically designed for vocabulary acquisition.",
            duration: "18:45",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            thumbnail: "https://via.placeholder.com/320x180/ec4899/ffffff?text=Lesson+2"
        },
        {
            id: 3,
            title: "Latin and Greek Roots",
            description: "Explore the most common Latin and Greek roots that form the foundation of English vocabulary.",
            duration: "22:15",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail: "https://via.placeholder.com/320x180/8b5cf6/ffffff?text=Lesson+3"
        },
        {
            id: 4,
            title: "Prefixes and Suffixes Mastery",
            description: "Master the art of breaking down complex words using prefixes and suffixes to understand their meanings instantly.",
            duration: "20:00",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            thumbnail: "https://via.placeholder.com/320x180/22c55e/ffffff?text=Lesson+4"
        },
        {
            id: 5,
            title: "Context Clues and Usage",
            description: "Learn how to use context clues to determine word meanings and use new vocabulary correctly in sentences.",
            duration: "16:30",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            thumbnail: "https://via.placeholder.com/320x180/f59e0b/ffffff?text=Lesson+5"
        },
        {
            id: 6,
            title: "Advanced Word Families",
            description: "Understand how words are related through families and how learning one word can help you learn dozens more.",
            duration: "19:20",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
            thumbnail: "https://via.placeholder.com/320x180/ef4444/ffffff?text=Lesson+6"
        },
        {
            id: 7,
            title: "Vocabulary in Professional Settings",
            description: "Master business and professional vocabulary to communicate effectively in workplace environments.",
            duration: "21:45",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
            thumbnail: "https://via.placeholder.com/320x180/06b6d4/ffffff?text=Lesson+7"
        },
        {
            id: 8,
            title: "Academic Vocabulary for Tests",
            description: "Prepare for SAT, GRE, and other standardized tests with targeted academic vocabulary strategies.",
            duration: "25:00",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
            thumbnail: "https://via.placeholder.com/320x180/a855f7/ffffff?text=Lesson+8"
        },
        {
            id: 9,
            title: "Spaced Repetition Techniques",
            description: "Implement scientifically-proven spaced repetition systems to ensure long-term vocabulary retention.",
            duration: "17:15",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
            thumbnail: "https://via.placeholder.com/320x180/14b8a6/ffffff?text=Lesson+9"
        },
        {
            id: 10,
            title: "Final Review and Practice",
            description: "Comprehensive review of all techniques learned with practical exercises and real-world applications.",
            duration: "23:30",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            thumbnail: "https://via.placeholder.com/320x180/6366f1/ffffff?text=Lesson+10"
        }
    ]
};

// Helper function to get video by ID
export function getVideoById(id) {
    return courseData.videos.find(video => video.id === id);
}

// Helper function to get next video
export function getNextVideo(currentId) {
    const currentIndex = courseData.videos.findIndex(v => v.id === currentId);
    if (currentIndex < courseData.videos.length - 1) {
        return courseData.videos[currentIndex + 1];
    }
    return null;
}

// Helper function to get previous video
export function getPreviousVideo(currentId) {
    const currentIndex = courseData.videos.findIndex(v => v.id === currentId);
    if (currentIndex > 0) {
        return courseData.videos[currentIndex - 1];
    }
    return null;
}
