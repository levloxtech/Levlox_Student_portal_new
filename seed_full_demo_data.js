/**
 * Levlox Portal - Comprehensive Demo Data Seed Script
 * 
 * Generates:
 * - 4 Rich Courses
 * - 4 Batches (with syllabus, schedules, trainer assignments)
 * - 4 Demo Trainers (password: Trainer@123)
 * - 32 Demo Students (8 per batch, real portrait headshots, phone, roll numbers, fees, attendance, password: Student@123)
 * - Users table sync with PBKDF2-SHA512 password hashes (Admin: Root@123)
 * - Live Classes (scheduled/live sessions with meet links)
 * - Recorded Lectures
 * - Announcements
 * - Attendance Records & Sheets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

const now = new Date().toISOString();
const todayDate = now.split('T')[0];
const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// ============================================================================
// 1. COURSES
// ============================================================================
const courses = [
  {
    id: "course_ds_ai",
    uid: "course_ds_ai",
    courseId: "COURSE-001",
    code: "COURSE-001",
    title: "Data Science & AI",
    name: "Data Science & AI",
    category: "Artificial Intelligence",
    duration: "60 Days",
    level: "Advanced",
    description: "End-to-end Machine Learning, Deep Learning, Generative AI, PyTorch, and NLP architectures.",
    status: "Active",
    modulesCount: 8,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "course_fsd_mern",
    uid: "course_fsd_mern",
    courseId: "COURSE-002",
    code: "COURSE-002",
    title: "Fullstack Web Development",
    name: "Fullstack Web Development",
    category: "Software Engineering",
    duration: "50 Days",
    level: "Intermediate",
    description: "Modern Fullstack JavaScript development with React 19, Node.js, Express, Next.js, and MongoDB.",
    status: "Active",
    modulesCount: 7,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "course_cloud_devops",
    uid: "course_cloud_devops",
    courseId: "COURSE-003",
    code: "COURSE-003",
    title: "Cloud & DevOps Engineering",
    name: "Cloud & DevOps Engineering",
    category: "Cloud Infrastructure",
    duration: "45 Days",
    level: "Intermediate",
    description: "Cloud computing fundamentals, Docker containerization, Kubernetes orchestration, CI/CD, and AWS services.",
    status: "Active",
    modulesCount: 6,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "course_cyber_sec",
    uid: "course_cyber_sec",
    courseId: "COURSE-004",
    code: "COURSE-004",
    title: "Cyber Security & Ethical Hacking",
    name: "Cyber Security & Ethical Hacking",
    category: "Cybersecurity",
    duration: "50 Days",
    level: "Intermediate",
    description: "Ethical hacking methodologies, network penetration testing, digital forensics, and defensive security.",
    status: "Active",
    modulesCount: 6,
    createdAt: now,
    updatedAt: now
  }
];

// ============================================================================
// 2. TRAINERS (4 Trainers, password: Trainer@123)
// ============================================================================
const trainerCreds = hashPassword("Trainer@123");

const trainers = [
  {
    id: "trainer_sudhan_001",
    uid: "trainer_sudhan_001",
    name: "sudhan",
    email: "rhariharasudhan0@gmail.com",
    phone: "9585838139",
    mobile: "9585838139",
    specialization: "Data Science & AI",
    course: "Data Science & AI",
    status: "Active",
    trainerId: "TRN001013",
    trainer_id: "TRN001013",
    code: "TRN001013",
    role: "trainer",
    mustChangePassword: false,
    profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    profile_pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    assigned_batch_ids: ["batch_ds_ai_01"],
    assigned_batches: ["batch_ds_ai_01"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "trainer_aakash_002",
    uid: "trainer_aakash_002",
    name: "Aakash Kumar",
    email: "aakash.trainer@levlox.com",
    phone: "9876543210",
    mobile: "9876543210",
    specialization: "Fullstack Web Development",
    course: "Fullstack Web Development",
    status: "Active",
    trainerId: "TRN001014",
    trainer_id: "TRN001014",
    code: "TRN001014",
    role: "trainer",
    mustChangePassword: false,
    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    profile_pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    assigned_batch_ids: ["batch_fsd_02"],
    assigned_batches: ["batch_fsd_02"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "trainer_sarah_003",
    uid: "trainer_sarah_003",
    name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@levlox.com",
    phone: "9876543211",
    mobile: "9876543211",
    specialization: "Cloud & DevOps Engineering",
    course: "Cloud & DevOps Engineering",
    status: "Active",
    trainerId: "TRN001015",
    trainer_id: "TRN001015",
    code: "TRN001015",
    role: "trainer",
    mustChangePassword: false,
    profilePic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    profile_pic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    assigned_batch_ids: ["batch_cloud_03"],
    assigned_batches: ["batch_cloud_03"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "trainer_rajesh_004",
    uid: "trainer_rajesh_004",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@levlox.com",
    phone: "9876543212",
    mobile: "9876543212",
    specialization: "Cyber Security & Ethical Hacking",
    course: "Cyber Security & Ethical Hacking",
    status: "Active",
    trainerId: "TRN001016",
    trainer_id: "TRN001016",
    code: "TRN001016",
    role: "trainer",
    mustChangePassword: false,
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    profile_pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    assigned_batch_ids: ["batch_cyber_04"],
    assigned_batches: ["batch_cyber_04"],
    createdAt: now,
    updatedAt: now
  }
];

// ============================================================================
// 3. 32 DEMO STUDENTS (8 per batch, password: Student@123)
// ============================================================================
const studentCreds = hashPassword("Student@123");

const studentPhotoPool = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80"
];

const rawStudentsList = [
  // Batch 1: Data Science & AI (8 students)
  { name: "Aditya Verma", email: "aditya.verma@levlox.student", phone: "9820101001", gender: "Male", city: "Bangalore", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Paid", attRate: 94, pts: 120 },
  { name: "Pooja Patel", email: "pooja.patel@levlox.student", phone: "9820101002", gender: "Female", city: "Ahmedabad", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Paid", attRate: 98, pts: 145 },
  { name: "Rohan Iyer", email: "rohan.iyer@levlox.student", phone: "9820101003", gender: "Male", city: "Chennai", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Pending", attRate: 88, pts: 95 },
  { name: "Sneha Reddy", email: "sneha.reddy@levlox.student", phone: "9820101004", gender: "Female", city: "Hyderabad", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Paid", attRate: 92, pts: 110 },
  { name: "Kavya Nair", email: "kavya.nair@levlox.student", phone: "9820101005", gender: "Female", city: "Kochi", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Paid", attRate: 96, pts: 130 },
  { name: "Vikram Malhotra", email: "vikram.malhotra@levlox.student", phone: "9820101006", gender: "Male", city: "Delhi", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Pending", attRate: 82, pts: 80 },
  { name: "Ananya Sen", email: "ananya.sen@levlox.student", phone: "9820101007", gender: "Female", city: "Kolkata", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Paid", attRate: 90, pts: 115 },
  { name: "Rahul Deshmukh", email: "rahul.deshmukh@levlox.student", phone: "9820101008", gender: "Male", city: "Pune", batchKey: "batch_ds_ai_01", courseKey: "Data Science & AI", fees: "Pending", attRate: 86, pts: 85 },

  // Batch 2: Fullstack Web Development (8 students)
  { name: "Deepak Sundaram", email: "deepak.s@levlox.student", phone: "9820101009", gender: "Male", city: "Coimbatore", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Paid", attRate: 95, pts: 140 },
  { name: "Meera Krishnan", email: "meera.k@levlox.student", phone: "9820101010", gender: "Female", city: "Trivandrum", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Paid", attRate: 97, pts: 150 },
  { name: "Gautam Choudhury", email: "gautam.c@levlox.student", phone: "9820101011", gender: "Male", city: "Guwahati", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Pending", attRate: 84, pts: 75 },
  { name: "Tanvi Bhatia", email: "tanvi.b@levlox.student", phone: "9820101012", gender: "Female", city: "Chandigarh", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Paid", attRate: 91, pts: 105 },
  { name: "Arjun Kapoor", email: "arjun.k@levlox.student", phone: "9820101013", gender: "Male", city: "Mumbai", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Paid", attRate: 89, pts: 100 },
  { name: "Divya Prakash", email: "divya.p@levlox.student", phone: "9820101014", gender: "Female", city: "Lucknow", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Pending", attRate: 79, pts: 65 },
  { name: "Harish Venkat", email: "harish.v@levlox.student", phone: "9820101015", gender: "Male", city: "Madurai", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Paid", attRate: 93, pts: 125 },
  { name: "Shruti Joshi", email: "shruti.j@levlox.student", phone: "9820101016", gender: "Female", city: "Nagpur", batchKey: "batch_fsd_02", courseKey: "Fullstack Web Development", fees: "Paid", attRate: 96, pts: 135 },

  // Batch 3: Cloud & DevOps (8 students)
  { name: "Manish Tiwari", email: "manish.t@levlox.student", phone: "9820101017", gender: "Male", city: "Bhopal", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Paid", attRate: 92, pts: 110 },
  { name: "Nisha Agrawal", email: "nisha.a@levlox.student", phone: "9820101018", gender: "Female", city: "Indore", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Pending", attRate: 85, pts: 90 },
  { name: "Siddharth Rao", email: "siddharth.r@levlox.student", phone: "9820101019", gender: "Male", city: "Mangalore", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Paid", attRate: 94, pts: 120 },
  { name: "Preeti Saxena", email: "preeti.s@levlox.student", phone: "9820101020", gender: "Female", city: "Jaipur", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Paid", attRate: 98, pts: 155 },
  { name: "Karthik Murthy", email: "karthik.m@levlox.student", phone: "9820101021", gender: "Male", city: "Mysore", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Pending", attRate: 80, pts: 70 },
  { name: "Priyanka Chawla", email: "priyanka.c@levlox.student", phone: "9820101022", gender: "Female", city: "Noida", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Paid", attRate: 90, pts: 100 },
  { name: "Abhishek Bose", email: "abhishek.b@levlox.student", phone: "9820101023", gender: "Male", city: "Bhubaneswar", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Paid", attRate: 95, pts: 130 },
  { name: "Shreya Guha", email: "shreya.g@levlox.student", phone: "9820101024", gender: "Female", city: "Patna", batchKey: "batch_cloud_03", courseKey: "Cloud & DevOps Engineering", fees: "Pending", attRate: 83, pts: 85 },

  // Batch 4: Cyber Security (8 students)
  { name: "Varun Pillai", email: "varun.p@levlox.student", phone: "9820101025", gender: "Male", city: "Salem", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Paid", attRate: 93, pts: 115 },
  { name: "Rhea Mukherjee", email: "rhea.m@levlox.student", phone: "9820101026", gender: "Female", city: "Kolkata", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Paid", attRate: 96, pts: 140 },
  { name: "Naveen Swaminathan", email: "naveen.s@levlox.student", phone: "9820101027", gender: "Male", city: "Trichy", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Pending", attRate: 86, pts: 80 },
  { name: "Anjali Menon", email: "anjali.m@levlox.student", phone: "9820101028", gender: "Female", city: "Calicut", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Paid", attRate: 97, pts: 145 },
  { name: "Sameer Kulkarni", email: "sameer.k@levlox.student", phone: "9820101029", gender: "Male", city: "Nashik", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Pending", attRate: 78, pts: 60 },
  { name: "Pooja Hegde", email: "pooja.h@levlox.student", phone: "9820101030", gender: "Female", city: "Hubli", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Paid", attRate: 91, pts: 105 },
  { name: "Tarun Nambiar", email: "tarun.n@levlox.student", phone: "9820101031", gender: "Male", city: "Kannur", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Paid", attRate: 94, pts: 125 },
  { name: "Simran Kaur", email: "simran.k@levlox.student", phone: "9820101032", gender: "Female", city: "Amritsar", batchKey: "batch_cyber_04", courseKey: "Cyber Security & Ethical Hacking", fees: "Pending", attRate: 85, pts: 90 }
];

const batchNamesMap = {
  "batch_ds_ai_01": "AI & Deep Learning - Batch Alpha",
  "batch_fsd_02": "Fullstack MERN Web Dev - Batch Beta",
  "batch_cloud_03": "Cloud & DevOps Masterclass - Batch Gamma",
  "batch_cyber_04": "Cyber Security Operations - Batch Delta"
};

const students = rawStudentsList.map((st, idx) => {
  const rollIndex = 139 + idx;
  const rollNumber = `LVX070${rollIndex}`;
  const studentUid = `student_demo_${String(rollIndex).padStart(4, '0')}`;
  const photo = studentPhotoPool[idx % studentPhotoPool.length];
  const isPaid = st.fees === "Paid";
  const feesTotal = 25000;
  const feesPaid = isPaid ? 25000 : (idx % 2 === 0 ? 10000 : 0);
  const feesRemaining = feesTotal - feesPaid;

  return {
    id: studentUid,
    uid: studentUid,
    name: st.name,
    email: st.email,
    phone: st.phone,
    mobile: st.phone,
    course: st.courseKey,
    course_name: st.courseKey,
    batch_id: st.batchKey,
    batchId: st.batchKey,
    batch: batchNamesMap[st.batchKey],
    batch_name: batchNamesMap[st.batchKey],
    rollNumber: rollNumber,
    feesStatus: isPaid ? "Paid" : (feesPaid > 0 ? "Partially Paid" : "Pending Payment"),
    feesTotal: feesTotal,
    feesPaidAmount: feesPaid,
    feesRemainingAmount: feesRemaining,
    status: "active",
    emailVerified: true,
    verificationStatus: "Verified",
    emailDeliveryStatus: "Ready",
    role: "student",
    mustChangePassword: false,
    createdBy: "super_admin_001",
    dob: "2002-05-15",
    gender: st.gender,
    city: st.city,
    location: `${st.city}, India`,
    current_location: `${st.city}, India`,
    guardian_name: `${st.name.split(' ')[0]}'s Guardian`,
    guardian_phone: `9840${String(100000 + idx).slice(1)}`,
    profilePic: photo,
    profile_pic: photo,
    profilePhotoUrl: photo,
    password: "Student@123",
    tempPassword: "Student@123",
    attendanceRate: st.attRate,
    activityScore: st.pts,
    createdAt: now,
    updatedAt: now
  };
});

// ============================================================================
// 4. 4 BATCHES
// ============================================================================
const batches = [
  {
    id: "batch_ds_ai_01",
    uid: "batch_ds_ai_01",
    code: "BAT-7101",
    batchId: "BAT-7101",
    name: "AI & Deep Learning - Batch Alpha",
    course_name: "Data Science & AI",
    trainer_name: "sudhan",
    trainer_uid: "trainer_sudhan_001",
    trainer_id: "TRN001013",
    trainer_email: "rhariharasudhan0@gmail.com",
    start_date: "2026-10-01",
    end_date: "2026-11-30",
    duration_days: 60,
    timing: "09:30 AM - 11:30 AM",
    status: "Active",
    max_students: 30,
    student_ids: students.filter(s => s.batch_id === "batch_ds_ai_01").map(s => s.id),
    students_count: 8,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "batch_fsd_02",
    uid: "batch_fsd_02",
    code: "BAT-7102",
    batchId: "BAT-7102",
    name: "Fullstack MERN Web Dev - Batch Beta",
    course_name: "Fullstack Web Development",
    trainer_name: "Aakash Kumar",
    trainer_uid: "trainer_aakash_002",
    trainer_id: "TRN001014",
    trainer_email: "aakash.trainer@levlox.com",
    start_date: "2026-10-05",
    end_date: "2026-11-25",
    duration_days: 50,
    timing: "11:45 AM - 01:45 PM",
    status: "Active",
    max_students: 30,
    student_ids: students.filter(s => s.batch_id === "batch_fsd_02").map(s => s.id),
    students_count: 8,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "batch_cloud_03",
    uid: "batch_cloud_03",
    code: "BAT-7103",
    batchId: "BAT-7103",
    name: "Cloud & DevOps Masterclass - Batch Gamma",
    course_name: "Cloud & DevOps Engineering",
    trainer_name: "Dr. Sarah Jenkins",
    trainer_uid: "trainer_sarah_003",
    trainer_id: "TRN001015",
    trainer_email: "sarah.jenkins@levlox.com",
    start_date: "2026-10-10",
    end_date: "2026-11-25",
    duration_days: 45,
    timing: "02:30 PM - 04:30 PM",
    status: "Active",
    max_students: 30,
    student_ids: students.filter(s => s.batch_id === "batch_cloud_03").map(s => s.id),
    students_count: 8,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "batch_cyber_04",
    uid: "batch_cyber_04",
    code: "BAT-7104",
    batchId: "BAT-7104",
    name: "Cyber Security Operations - Batch Delta",
    course_name: "Cyber Security & Ethical Hacking",
    trainer_name: "Rajesh Sharma",
    trainer_uid: "trainer_rajesh_004",
    trainer_id: "TRN001016",
    trainer_email: "rajesh.sharma@levlox.com",
    start_date: "2026-10-12",
    end_date: "2026-12-02",
    duration_days: 50,
    timing: "05:00 PM - 07:00 PM",
    status: "Active",
    max_students: 30,
    student_ids: students.filter(s => s.batch_id === "batch_cyber_04").map(s => s.id),
    students_count: 8,
    createdAt: now,
    updatedAt: now
  }
];

// ============================================================================
// 5. LIVE CLASSES
// ============================================================================
const liveClasses = [
  {
    id: "live_cls_01",
    uid: "live_cls_01",
    title: "Transformers, Attention & Large Language Models Architecture",
    instructor: "sudhan",
    trainer_name: "sudhan",
    meet_link: "https://meet.google.com/abc-dsai-xyz",
    meetLink: "https://meet.google.com/abc-dsai-xyz",
    date: todayDate,
    time: "09:30 AM - 11:30 AM",
    description: "Deep dive into self-attention, multi-head attention, and fine-tuning Hugging Face models.",
    status: "Live",
    is_today: true,
    is_published: true,
    batch_id: "batch_ds_ai_01",
    batch_name: "AI & Deep Learning - Batch Alpha",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "live_cls_02",
    uid: "live_cls_02",
    title: "React 19 Server Components, Actions & Optimistic UI",
    instructor: "Aakash Kumar",
    trainer_name: "Aakash Kumar",
    meet_link: "https://meet.google.com/fsd-react-live",
    meetLink: "https://meet.google.com/fsd-react-live",
    date: todayDate,
    time: "11:45 AM - 01:45 PM",
    description: "Building production-grade client-server boundaries, caching strategies, and form action mutations.",
    status: "Scheduled",
    is_today: true,
    is_published: true,
    batch_id: "batch_fsd_02",
    batch_name: "Fullstack MERN Web Dev - Batch Beta",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "live_cls_03",
    uid: "live_cls_03",
    title: "Kubernetes Ingress Controllers, Cert-Manager & TLS Termination",
    instructor: "Dr. Sarah Jenkins",
    trainer_name: "Dr. Sarah Jenkins",
    meet_link: "https://meet.google.com/cld-k8s-infra",
    meetLink: "https://meet.google.com/cld-k8s-infra",
    date: todayDate,
    time: "02:30 PM - 04:30 PM",
    description: "Hands-on setup of NGINX Ingress Controller, Let's Encrypt TLS certificates, and canary deployments.",
    status: "Scheduled",
    is_today: true,
    is_published: true,
    batch_id: "batch_cloud_03",
    batch_name: "Cloud & DevOps Masterclass - Batch Gamma",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "live_cls_04",
    uid: "live_cls_04",
    title: "Network Packet Analysis with Wireshark & Snort IDS",
    instructor: "Rajesh Sharma",
    trainer_name: "Rajesh Sharma",
    meet_link: "https://meet.google.com/sec-wireshark-lab",
    meetLink: "https://meet.google.com/sec-wireshark-lab",
    date: todayDate,
    time: "05:00 PM - 07:00 PM",
    description: "Analyzing TCP three-way handshakes, malware beacon traffic, and configuring intrusion detection signatures.",
    status: "Scheduled",
    is_today: true,
    is_published: true,
    batch_id: "batch_cyber_04",
    batch_name: "Cyber Security Operations - Batch Delta",
    createdAt: now,
    updatedAt: now
  }
];

// ============================================================================
// 6. RECORDED CLASSES
// ============================================================================
const recordedClasses = [
  {
    id: "rec_ds_01",
    uid: "rec_ds_01",
    title: "Python for Data Science - NumPy & Vectorized Operations",
    module: "Module 1 - Python Foundations",
    video_url: "https://www.youtube.com/watch?v=QUT1VHiLmmI",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    description: "Core arrays, broadcasting, matrix algebra, and benchmark profiling.",
    course_title: "Data Science & AI",
    batch_id: "batch_ds_ai_01",
    batch_name: "AI & Deep Learning - Batch Alpha",
    duration: "1h 24m",
    video_source_type: "link",
    study_materials: [],
    sort_order: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "rec_ds_02",
    uid: "rec_ds_02",
    title: "Exploratory Data Analysis with Pandas & Seaborn",
    module: "Module 2 - Data Wrangling",
    video_url: "https://www.youtube.com/watch?v=vmEHCJofslg",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    description: "Cleaning messy datasets, outlier imputation, distribution plots, and correlation heatmaps.",
    course_title: "Data Science & AI",
    batch_id: "batch_ds_ai_01",
    batch_name: "AI & Deep Learning - Batch Alpha",
    duration: "1h 45m",
    video_source_type: "link",
    study_materials: [],
    sort_order: 2,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "rec_fsd_01",
    uid: "rec_fsd_01",
    title: "Modern JavaScript (ESNext) & Asynchronous Programming",
    module: "Module 1 - Core JavaScript",
    video_url: "https://www.youtube.com/watch?v=PoRJizFvM7s",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop&q=80",
    description: "Event loop internals, Promises, async/await patterns, and memory management.",
    course_title: "Fullstack Web Development",
    batch_id: "batch_fsd_02",
    batch_name: "Fullstack MERN Web Dev - Batch Beta",
    duration: "1h 15m",
    video_source_type: "link",
    study_materials: [],
    sort_order: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "rec_fsd_02",
    uid: "rec_fsd_02",
    title: "Building RESTful APIs with Node.js, Express & Zod Validation",
    module: "Module 2 - Backend Services",
    video_url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=80",
    description: "Middleware routing architecture, JWT token security, and request payload schema validation.",
    course_title: "Fullstack Web Development",
    batch_id: "batch_fsd_02",
    batch_name: "Fullstack MERN Web Dev - Batch Beta",
    duration: "1h 38m",
    video_source_type: "link",
    study_materials: [],
    sort_order: 2,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "rec_cloud_01",
    uid: "rec_cloud_01",
    title: "Docker Essentials: Multi-Stage Builds & Optimization",
    module: "Module 1 - Containers",
    video_url: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    thumbnail: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80",
    description: "Creating minimal distroless Docker images and managing container networking.",
    course_title: "Cloud & DevOps Engineering",
    batch_id: "batch_cloud_03",
    batch_name: "Cloud & DevOps Masterclass - Batch Gamma",
    duration: "1h 10m",
    video_source_type: "link",
    study_materials: [],
    sort_order: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "rec_cyber_01",
    uid: "rec_cyber_01",
    title: "Linux Command Line Forensics & Bash Scripting for Hackers",
    module: "Module 1 - Linux Security",
    video_url: "https://www.youtube.com/watch?v=lZAoFs75_cs",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
    description: "Analyzing /var/log entries, crontab persistence mechanisms, and process memory maps.",
    course_title: "Cyber Security & Ethical Hacking",
    batch_id: "batch_cyber_04",
    batch_name: "Cyber Security Operations - Batch Delta",
    duration: "1h 25m",
    video_source_type: "link",
    study_materials: [],
    sort_order: 1,
    createdAt: now,
    updatedAt: now
  }
];

// ============================================================================
// 7. ANNOUNCEMENTS
// ============================================================================
const announcements = [
  {
    id: "ann_01",
    uid: "ann_01",
    title: "🚀 Levlox Annual Hackathon 2026 Announced!",
    content: "Registrations are now open for the 48-hour Levlox Tech Innovation Hackathon with exciting cash prizes and mentor feedback from industry leaders.",
    priority: "High",
    target: "all",
    createdBy: "Super Admin",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "ann_02",
    uid: "ann_02",
    title: "📌 Capstone Project Guidelines & Submission Deadlines",
    content: "All batch students are advised to submit their capstone project proposals by next Friday. Ensure your GitHub repo link and live demo are included.",
    priority: "Medium",
    target: "all",
    createdBy: "Super Admin",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "ann_03",
    uid: "ann_03",
    title: "💡 Guest Lecture: Production Microservices with Kubernetes",
    content: "Join us this Saturday at 03:00 PM IST for an exclusive guest session by a Senior Staff DevOps Architect from Google Cloud.",
    priority: "Low",
    target: "all",
    createdBy: "Super Admin",
    createdAt: now,
    updatedAt: now
  }
];

// ============================================================================
// 8. ATTENDANCE (Past attendance records so graphs render immediately)
// ============================================================================
const attendance = [];
const attendanceSheets = [];

batches.forEach(b => {
  const batchStudents = students.filter(s => s.batch_id === b.id);

  // Generate for yesterday and today
  [yesterdayDate, todayDate].forEach(dateStr => {
    let presentCount = 0;
    let absentCount = 0;

    batchStudents.forEach((st, sIdx) => {
      // Realistic attendance: 1 or 2 absent per batch occasionally
      const isAbsent = (sIdx === 2 && dateStr === yesterdayDate) || (sIdx === 5 && dateStr === todayDate);
      const status = isAbsent ? "Absent" : "Present";
      if (status === "Present") presentCount++;
      else absentCount++;

      const docId = `${b.id}_${dateStr}_${st.id}`;
      attendance.push({
        id: docId,
        uid: docId,
        studentId: st.id,
        student_id: st.id,
        studentName: st.name,
        student_name: st.name,
        rollNumber: st.rollNumber,
        course: b.course_name,
        batchId: b.id,
        batch_id: b.id,
        batchName: b.name,
        batch_name: b.name,
        date: dateStr,
        status: status,
        marked_by: b.trainer_name,
        attendance_mode: "Manual",
        marked_time: "10:00 AM",
        createdAt: now,
        updatedAt: now
      });
    });

    const sheetId = `${b.id}_${dateStr}`;
    attendanceSheets.push({
      id: sheetId,
      uid: sheetId,
      batchId: b.id,
      batch_id: b.id,
      batchName: b.name,
      batch_name: b.name,
      courseName: b.course_name,
      date: dateStr,
      markedBy: b.trainer_name,
      total: batchStudents.length,
      present: presentCount,
      absent: absentCount,
      percentage: Math.round((presentCount / batchStudents.length) * 100),
      createdAt: now,
      updatedAt: now
    });
  });
});

// ============================================================================
// 9. USERS (Synced with admin + trainers + students)
// ============================================================================
const adminCreds = hashPassword("Root@123");

const users = [
  // Super Admin
  {
    id: "super_admin_001",
    uid: "super_admin_001",
    email: "levloxtech@gmail.com",
    name: "Super Admin",
    role: "admin",
    status: "active",
    salt: adminCreds.salt,
    passwordHash: adminCreds.hash,
    createdAt: now,
    updatedAt: now
  },
  // Trainers
  ...trainers.map(t => ({
    id: t.id,
    uid: t.id,
    email: t.email,
    name: t.name,
    role: "trainer",
    phone: t.phone,
    status: "Active",
    salt: trainerCreds.salt,
    passwordHash: trainerCreds.hash,
    customPasswordSet: true,
    mustChangePassword: false,
    profilePic: t.profilePic,
    profile_pic: t.profile_pic,
    createdAt: now,
    updatedAt: now
  })),
  // Students
  ...students.map(s => ({
    id: s.id,
    uid: s.id,
    email: s.email,
    name: s.name,
    role: "student",
    phone: s.phone,
    status: "Active",
    salt: studentCreds.salt,
    passwordHash: studentCreds.hash,
    customPasswordSet: true,
    mustChangePassword: false,
    profilePic: s.profilePic,
    profile_pic: s.profile_pic,
    createdAt: now,
    updatedAt: now
  }))
];

// Admin collection record
const admins = [
  {
    id: "super_admin_001",
    uid: "super_admin_001",
    name: "Super Admin",
    email: "levloxtech@gmail.com",
    role: "admin",
    status: "active",
    createdAt: now,
    updatedAt: now
  }
];

// Export / Save function
module.exports = {
  courses,
  batches,
  trainers,
  students,
  users,
  admins,
  liveClasses,
  recordedClasses,
  announcements,
  attendance,
  attendanceSheets
};

// If run directly: write to target directory
if (require.main === module) {
  const targetDir = process.argv[2] || path.join(__dirname, 'storage', 'data');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const collections = {
    courses,
    batches,
    trainers,
    students,
    users,
    admins,
    liveClasses,
    recordedClasses,
    announcements,
    attendance,
    attendanceSheets
  };

  Object.entries(collections).forEach(([name, data]) => {
    const file = path.join(targetDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[Seed] Written ${data.length} records to ${file}`);
  });

  console.log('\n=== SEED DATA GENERATED SUCCESSFULLY ===');
  console.log(`Courses: ${courses.length}`);
  console.log(`Batches: ${batches.length}`);
  console.log(`Trainers: ${trainers.length}`);
  console.log(`Students: ${students.length}`);
  console.log(`Users total: ${users.length}`);
  console.log(`Live Classes: ${liveClasses.length}`);
  console.log(`Recorded Classes: ${recordedClasses.length}`);
  console.log(`Announcements: ${announcements.length}`);
  console.log(`Attendance Records: ${attendance.length}`);
  console.log(`Attendance Sheets: ${attendanceSheets.length}`);
}

