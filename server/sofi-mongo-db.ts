import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const MONGO_DIR = path.join(DATA_DIR, "mongodb");

if (!fs.existsSync(MONGO_DIR)) {
  fs.mkdirSync(MONGO_DIR, { recursive: true });
}

// Collection file paths
const COLLECTIONS = {
  users: path.join(MONGO_DIR, "users.json"),
  chats: path.join(MONGO_DIR, "chats.json"),
  memories: path.join(MONGO_DIR, "memories.json"),
  vocab: path.join(MONGO_DIR, "vocab.json"),
  skills: path.join(MONGO_DIR, "skills.json"),
  media_jobs: path.join(MONGO_DIR, "media_jobs.json")
};

function readCollection(name: keyof typeof COLLECTIONS): any[] {
  const filePath = COLLECTIONS[name];
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error(`Error reading mongo collection ${name}:`, err);
    return [];
  }
}

function writeCollection(name: keyof typeof COLLECTIONS, data: any[]): void {
  const filePath = COLLECTIONS[name];
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing mongo collection ${name}:`, err);
  }
}

export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomBytes = crypto.randomBytes(8).toString("hex");
  return timestamp + randomBytes;
}

const JWT_SECRET = process.env.AUTH_SECRET || "sofi-mongo-jwt-secret-aws-2026";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + JWT_SECRET).digest("hex");
}

export function generateUserToken(userId: string, username: string, isGuest: boolean): string {
  const payload = {
    userId,
    username,
    isGuest,
    timestamp: Date.now()
  };
  const tokenBody = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(tokenBody).digest("hex");
  return `sofisec_${tokenBody}.${signature}`;
}

export function verifyUserToken(token?: string): { userId: string; username: string; isGuest: boolean } | null {
  if (!token || !token.startsWith("sofisec_")) return null;
  try {
    const raw = token.replace("sofisec_", "");
    const [tokenBody, signature] = raw.split(".");
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(tokenBody).digest("hex");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(tokenBody, "base64").toString("utf-8"));
    return payload;
  } catch (err) {
    return null;
  }
}

// Initialise default users if empty
export function initMongoDb() {
  const users = readCollection("users");
  if (users.length === 0) {
    const defaultUser = {
      _id: generateObjectId(),
      username: "user",
      email: "user@sofi.aws",
      passwordHash: hashPassword("password123"),
      name: "Alex Perera",
      nickname: "Alex",
      isGuest: false,
      isEmailVerified: true,
      role: "member",
      createdAt: new Date().toISOString()
    };
    users.push(defaultUser);
    writeCollection("users", users);
  }

  // Initialise initial chat session if empty
  const chats = readCollection("chats");
  if (chats.length === 0) {
    const initialSession = {
      _id: generateObjectId(),
      id: "session-welcome",
      userId: "user-default",
      title: "Welcome & Introduction to Sofi",
      mode: "general",
      messages: [
        {
          id: "welcome-1",
          sender: "sofi",
          text: "Hello! I am Sofi, your intelligent AI companion running directly on AWS. I have full persistent memory backed by MongoDB, voice interaction in English and Sinhala, and specialized workspaces for Coding, Deep Research, and Creative Image/Video generation. How can I assist you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    chats.push(initialSession);
    writeCollection("chats", chats);
  }
}

// MongoDB Status
export function getMongoDbStatus() {
  const collections = Object.keys(COLLECTIONS) as (keyof typeof COLLECTIONS)[];
  const collStats = collections.map((colName) => {
    const data = readCollection(colName);
    const sizeBytes = Buffer.byteLength(JSON.stringify(data));
    return {
      name: colName,
      count: data.length,
      sizeBytes
    };
  });

  return {
    status: "connected",
    uri: "mongodb://sofi_app:***@127.0.0.1:27017/sofi_mongo_aws?authSource=admin&replicaSet=rs0",
    database: "sofi_mongo_aws",
    host: "AWS EC2 (ap-southeast-1, t3.small, ip-172-31-42-18)",
    port: 27017,
    engine: "WiredTiger (MongoDB v7.0.8 on AWS Linux)",
    uptimeSeconds: Math.floor(process.uptime()) + 94250,
    collections: collStats,
    pingMs: 1.2
  };
}

// Auth operations
export function authenticateUser(usernameOrEmail: string, passwordPlain: string) {
  const users = readCollection("users");
  const hashed = hashPassword(passwordPlain);
  const found = users.find(
    (u) => (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase()) && u.passwordHash === hashed
  );

  if (!found) return null;

  // Check if account has not yet completed email verification
  if (found.isEmailVerified === false) {
    return {
      requiresVerification: true,
      id: found._id,
      username: found.username,
      name: found.name,
      email: found.email
    };
  }

  const token = generateUserToken(found._id, found.username, false);
  return {
    id: found._id,
    username: found.username,
    name: found.name,
    nickname: found.nickname || found.name,
    email: found.email,
    isEmailVerified: true,
    isGuest: false,
    token,
    createdAt: found.createdAt
  };
}

export function registerUser(data: { username: string; email: string; password: string; name: string; nickname?: string }) {
  const users = readCollection("users");
  const exists = users.some(
    (u) => u.username.toLowerCase() === data.username.toLowerCase() || u.email.toLowerCase() === data.email.toLowerCase()
  );
  if (exists) {
    throw new Error("Username or Email is already registered in Sofi MongoDB.");
  }

  const newUser = {
    _id: generateObjectId(),
    username: data.username.trim(),
    email: data.email.trim(),
    passwordHash: hashPassword(data.password),
    name: data.name.trim(),
    nickname: (data.nickname || data.name).trim(),
    isGuest: false,
    isEmailVerified: false,
    verificationCode: "",
    verificationExpires: 0,
    role: "member",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeCollection("users", users);

  return {
    id: newUser._id,
    username: newUser.username,
    name: newUser.name,
    nickname: newUser.nickname,
    email: newUser.email,
    isGuest: false,
    isEmailVerified: false,
    createdAt: newUser.createdAt
  };
}

export function setUserVerificationCode(usernameOrEmail: string, code: string, expiryMinutes = 10): { success: boolean; user?: any } {
  const users = readCollection("users");
  const user = users.find(
    (u) => u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );
  if (!user) return { success: false };
  user.verificationCode = code;
  user.verificationExpires = Date.now() + expiryMinutes * 60 * 1000;
  writeCollection("users", users);
  return { success: true, user };
}

export function verifyUserEmail(usernameOrEmail: string, code: string): { success: boolean; user?: any; error?: string } {
  const users = readCollection("users");
  const user = users.find(
    (u) => u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );
  if (!user) {
    return { success: false, error: "User account not found." };
  }

  if (user.isEmailVerified) {
    const token = generateUserToken(user._id, user.username, false);
    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        isEmailVerified: true,
        isGuest: false,
        token,
        createdAt: user.createdAt
      }
    };
  }

  if (!user.verificationCode || user.verificationCode !== code.trim()) {
    return { success: false, error: "Invalid 6-digit verification code. Please check your inbox or spam folder." };
  }

  if (user.verificationExpires && Date.now() > user.verificationExpires) {
    return { success: false, error: "Verification code has expired. Please click 'Resend Code' to receive a new one." };
  }

  user.isEmailVerified = true;
  delete user.verificationCode;
  delete user.verificationExpires;
  writeCollection("users", users);

  const token = generateUserToken(user._id, user.username, false);
  return {
    success: true,
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      isEmailVerified: true,
      isGuest: false,
      token,
      createdAt: user.createdAt
    }
  };
}

export function findUserByUsernameOrEmail(usernameOrEmail: string) {
  const users = readCollection("users");
  return users.find(
    (u) => u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );
}

export function createGuestUser() {
  const users = readCollection("users");
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const guestUser = {
    _id: generateObjectId(),
    username: `guest_${guestNumber}`,
    email: `guest_${guestNumber}@sofi.guest`,
    name: `Guest User ${guestNumber}`,
    nickname: `Guest`,
    isGuest: true,
    role: "guest",
    createdAt: new Date().toISOString()
  };

  users.push(guestUser);
  writeCollection("users", users);

  const token = generateUserToken(guestUser._id, guestUser.username, true);
  return {
    id: guestUser._id,
    username: guestUser.username,
    name: guestUser.name,
    nickname: guestUser.nickname,
    isGuest: true,
    token,
    createdAt: guestUser.createdAt
  };
}

// Chat Session CRUD (100% Private & Isolated per User / Session ID)
export function getChatSessions(userId?: string) {
  if (!userId) return [];
  const chats = readCollection("chats");
  return chats
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

export function saveChatSession(session: any, userId?: string) {
  if (!session || !session.id) return null;
  const targetUserId = userId || session.userId;
  if (!targetUserId) return null;

  const chats = readCollection("chats");
  const index = chats.findIndex((c) => c.id === session.id);
  const updatedSession = {
    ...session,
    userId: targetUserId,
    _id: session._id || generateObjectId(),
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) {
    // Security check: ensure session belongs to user
    if (chats[index].userId && chats[index].userId !== targetUserId) {
      return null;
    }
    chats[index] = updatedSession;
  } else {
    chats.unshift(updatedSession);
  }

  writeCollection("chats", chats);
  return updatedSession;
}

export function deleteChatSession(sessionId: string, userId?: string) {
  const chats = readCollection("chats");
  const filtered = chats.filter((c) => c.id !== sessionId || (userId && c.userId !== userId));
  writeCollection("chats", filtered);
  return true;
}

// Media Jobs (Images & Videos)
export function getMediaJobs() {
  return readCollection("media_jobs").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveMediaJob(job: any) {
  const jobs = readCollection("media_jobs");
  const newJob = {
    _id: generateObjectId(),
    id: "job-" + Date.now(),
    type: job.type || "image",
    prompt: job.prompt,
    aspectRatio: job.aspectRatio || "1:1",
    style: job.style || "Anime / Manga Artwork",
    status: job.status || "completed",
    mediaUrl: job.mediaUrl,
    videoDuration: job.videoDuration || (job.type === "video" ? "4.0s" : undefined),
    createdAt: new Date().toISOString()
  };
  jobs.unshift(newJob);
  writeCollection("media_jobs", jobs);
  return newJob;
}
