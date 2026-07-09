import mongoose from 'mongoose';
import University from './src/models/University.js';
import dotenv from 'dotenv';


dotenv.config();

const universities = [
  {
    name: "NED University of Engineering and Technology",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "NED University is one of Pakistan's oldest and most prestigious engineering institutions. Known for excellence in engineering education and research, it offers comprehensive programs in various engineering disciplines and has produced numerous industry leaders.",
    establishedYear: 1922,
    ranking: {
      national: 3,
      global: 1201
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Civil Engineering", duration: "4 years", degree: "B.E." },
      { name: "Computer Systems Engineering", duration: "4 years", degree: "B.E." },
      { name: "Electrical Engineering", duration: "4 years", degree: "B.E." },
      { name: "Mechanical Engineering", duration: "4 years", degree: "B.E." },
      { name: "Software Engineering", duration: "4 years", degree: "B.E." }
    ],
    facilities: [
      "Modern engineering labs",
      "Research centers",
      "Digital library",
      "Computer labs",
      "Sports facilities",
      "Auditoriums",
      "Innovation hub"
    ],   
  
    website: "https://www.neduet.edu.pk",
    email: "info@neduet.edu.pk",
    phone: "+92-21-9926-1261",
    admissionProcess: "Admission through NED-UET Entry Test based on intermediate marks and test performance",
    fees: {
      min: 150000,
      max: 300000,
      currency: "PKR"
    },
    image: "/images/NED_university_kaarchi.jpg",
    isActive: true
  },
  {
    name: "University of Karachi",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "University of Karachi is Pakistan's largest university, offering a wide range of programs across sciences, humanities, business, and social sciences. It has been a center of academic excellence and research for over seven decades.",
    establishedYear: 1951,
    ranking: {
      national: 8,
      global: 1501
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Business Administration", duration: "4 years", degree: "BBA" },
      { name: "Economics", duration: "4 years", degree: "BS" },
      { name: "Biotechnology", duration: "4 years", degree: "BS" },
      { name: "Mass Communication", duration: "4 years", degree: "BS" }
    ],
    facilities: [
      "Central library",
      "Multiple faculty buildings",
      "Computer labs",
      "Research centers",
      "Sports complex",
      "Medical facilities",
      "Student activity centers"
    ],
    website: "https://www.uok.edu.pk",
    email: "info@uok.edu.pk",
    phone: "+92-21-9926-1300",
    admissionProcess: "Admission based on intermediate marks and university entry test",
    fees: {
      min: 50000,
      max: 150000,
      currency: "PKR"
    },
    image: "/images/university_of_karachi.png",
    isActive: true
  },
  {
    name: "Aga Khan University",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "Aga Khan University is a private, autonomous university offering world-class education in health sciences, nursing, and medical sciences. It's known for its state-of-the-art hospital and research facilities, maintaining international standards of excellence.",
    establishedYear: 1983,
    ranking: {
      national: 2,
      global: 601
    },
    type: "Private",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Medicine and Surgery", duration: "5 years", degree: "MBBS" },
      { name: "Nursing", duration: "4 years", degree: "BSN" },
      { name: "Medical Education", duration: "2 years", degree: "M.Ed" },
      { name: "Public Health", duration: "2 years", degree: "MPH" },
      { name: "Bioethics", duration: "2 years", degree: "MA" }
    ],
    facilities: [
      "Aga Khan University Hospital",
      "Medical simulation center",
      "Research laboratories",
      "Medical library",
      "Sports facilities",
      "Student housing",
      "Conference centers"
    ],
    website: "https://www.aku.edu",
    email: "admissions@aku.edu",
    phone: "+92-21-3486-4955",
    admissionProcess: "Admission through AKU Entry Test and interview, MDCAT for medical programs",
    fees: {
      min: 500000,
      max: 2500000,
      currency: "PKR"
    },
    image: "/images/agha_khan.webp",
    isActive: true
  },
  {
    name: "Institute of Business Administration (IBA)",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "IBA Karachi is Pakistan's premier business school and one of the oldest outside North America. It offers top-tier business education and has produced many of Pakistan's leading business professionals and entrepreneurs.",
    establishedYear: 1955,
    ranking: {
      national: 1,
      global: 801
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Business Administration", duration: "4 years", degree: "BBA" },
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Economics", duration: "4 years", degree: "BS" },
      { name: "MBA", duration: "2 years", degree: "MBA" },
      { name: "Finance", duration: "1.5 years", degree: "MS" }
    ],
    facilities: [
      "Modern classrooms",
      "Computer labs",
      "Business incubation center",
      "Library and resource center",
      "Sports facilities",
      "Auditoriums",
      "Career development center"
    ],
    website: "https://www.iba.edu.pk",
    email: "admission@iba.edu.pk",
    phone: "+92-21-3810-4700",
    admissionProcess: "Admission through IBA Entry Test and interview process",
    fees: {
      min: 200000,
      max: 500000,
      currency: "PKR"
    },
    image: "/images/IBA.png",
    isActive: true
  },
  {
    name: "Bahria University Karachi Campus",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "Bahria University is a leading private institution offering quality education in engineering, computer science, business, and maritime studies. The Karachi campus features modern facilities and strong industry connections.",
    establishedYear: 2000,
    ranking: {
      national: 12,
      global: 1801
    },
    type: "Private",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Software Engineering", duration: "4 years", degree: "BS" },
      { name: "Business Administration", duration: "4 years", degree: "BBA" },
      { name: "Electrical Engineering", duration: "4 years", degree: "BE" },
      { name: "Maritime Sciences", duration: "4 years", degree: "BS" }
    ],
    facilities: [
      "Smart classrooms",
      "Engineering labs",
      "Computer labs",
      "Library",
      "Sports complex",
      "Maritime training facilities",
      "Cafeteria"
    ],
    website: "https://www.bahria.edu.pk/bukc",
    email: "info@bukc.bahria.edu.pk",
    phone: "+92-21-111-111-028",
    admissionProcess: "Admission through Bahria University Entry Test and intermediate marks",
    fees: {
      min: 180000,
      max: 400000,
      currency: "PKR"
    },
    image: "/images/bahria_university.webp",
    isActive: true
  },
  {
    name: "SZABIST Karachi",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "Shaheed Zulfikar Ali Bhutto Institute of Science and Technology (SZABIST) is a well-established private university known for its programs in management sciences, computer science, and social sciences with a focus on practical education.",
    establishedYear: 1995,
    ranking: {
      national: 15,
      global: 2001
    },
    type: "Private",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Business Administration", duration: "4 years", degree: "BBA" },
      { name: "Media Sciences", duration: "4 years", degree: "BS" },
      { name: "Social Sciences", duration: "4 years", degree: "BS" },
      { name: "MBA", duration: "2 years", degree: "MBA" }
    ],
    facilities: [
      "Modern campus",
      "Computer labs",
      "Media studios",
      "Library",
      "Sports facilities",
      "Auditorium",
      "Research centers"
    ],
    website: "https://www.szabist.edu.pk",
    email: "info@szabist.edu.pk",
    phone: "+92-21-3482-4947",
    admissionProcess: "Admission through SZABIST Entry Test or equivalent national test",
    fees: {
      min: 150000,
      max: 350000,
      currency: "PKR"
    },
    image: "/images/szabist.png",
    isActive: true
  },
  {
    name: "Dow University of Health Sciences",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "Dow University is one of Pakistan's leading health sciences universities, offering comprehensive medical education and healthcare services. It comprises multiple campuses and teaching hospitals across Karachi.",
    establishedYear: 1945,
    ranking: {
      national: 5,
      global: 1401
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Medicine and Surgery", duration: "5 years", degree: "MBBS" },
      { name: "Dental Surgery", duration: "5 years", degree: "BDS" },
      { name: "Pharmacy", duration: "5 years", degree: "Pharm.D" },
      { name: "Physical Therapy", duration: "5 years", degree: "DPT" },
      { name: "Public Health", duration: "2 years", degree: "MPH" }
    ],
    facilities: [
      "Multiple teaching hospitals",
      "Medical research labs",
      "Dental clinics",
      "Pharmacy labs",
      "Medical library",
      "Simulation center",
      "Student hostels"
    ],
    website: "https://www.duhs.edu.pk",
    email: "info@duhs.edu.pk",
    phone: "+92-21-9921-6042",
    admissionProcess: "Admission through MDCAT (Medical and Dental College Admission Test)",
    fees: {
      min: 200000,
      max: 800000,
      currency: "PKR"
    },
    image: "/images/dow_university.webp",
    isActive: true
  },
  {
    name: "FAST-NUCES Karachi Campus",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "FAST-NUCES is Pakistan's top-ranked computer science university, offering cutting-edge education in computing and engineering. The Karachi campus is known for its excellent faculty and strong industry partnerships.",
    establishedYear: 2000,
    ranking: {
      national: 4,
      global: 1101
    },
    type: "Private",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Software Engineering", duration: "4 years", degree: "BS" },
      { name: "Artificial Intelligence", duration: "4 years", degree: "BS" },
      { name: "Electrical Engineering", duration: "4 years", degree: "BE" },
      { name: "Data Science", duration: "2 years", degree: "MS" }
    ],
    facilities: [
      "State-of-the-art computer labs",
      "Research centers",
      "Digital library",
      "Innovation center",
      "Sports complex",
      "Auditoriums",
      "Cafeteria"
    ],
    website: "https://www.nu.edu.pk/Campus/Karachi",
    email: "admissions@khi.nu.edu.pk",
    phone: "+92-21-3449-7701",
    admissionProcess: "Admission through NUCES Entry Test (NET)",
    fees: {
      min: 250000,
      max: 450000,
      currency: "PKR"
    },
    image: "/images/fast_nuces.webp",
    isActive: true
  },
  {
    name: "LUMS - Lahore University of Management Sciences",
    location: {
      city: "Lahore",
      state: "Punjab",
      country: "Pakistan"
    },
    description: "LUMS is Pakistan's premier private university, ranked among the top institutions in Asia. It offers world-class education in business, engineering, humanities, law, and sciences with a focus on research and innovation.",
    establishedYear: 1984,
    ranking: {
      national: 1,
      global: 601
    },
    type: "Private",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Electrical Engineering", duration: "4 years", degree: "BSc" },
      { name: "Business Administration", duration: "4 years", degree: "BSc" },
      { name: "Economics", duration: "4 years", degree: "BS" },
      { name: "MBA", duration: "2 years", degree: "MBA" }
    ],
    facilities: [
      "State-of-the-art campus",
      "Research centers",
      "Modern library",
      "Sports complex",
      "Student hostels",
      "Innovation labs",
      "Entrepreneurship center"
    ],
    website: "https://www.lums.edu.pk",
    email: "admissions@lums.edu.pk",
    phone: "+92-42-3560-8000",
    admissionProcess: "Admission through LUMS Admission Test (LAT) and SAT scores",
    fees: {
      min: 400000,
      max: 800000,
      currency: "PKR"
    },
    image: null,
    isActive: true
  },
  {
    name: "University of Engineering and Technology Lahore",
    location: {
      city: "Lahore",
      state: "Punjab",
      country: "Pakistan"
    },
    description: "UET Lahore is Pakistan's oldest and most prestigious engineering university, established during the British era. It has produced countless engineers and industry leaders who have contributed significantly to Pakistan's development.",
    establishedYear: 1921,
    ranking: {
      national: 3,
      global: 1001
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Civil Engineering", duration: "4 years", degree: "BSc" },
      { name: "Mechanical Engineering", duration: "4 years", degree: "BSc" },
      { name: "Electrical Engineering", duration: "4 years", degree: "BSc" },
      { name: "Computer Engineering", duration: "4 years", degree: "BSc" },
      { name: "Chemical Engineering", duration: "4 years", degree: "BSc" }
    ],
    facilities: [
      "Engineering workshops",
      "Research labs",
      "Central library",
      "Computer centers",
      "Sports facilities",
      "Hostels",
      "Auditoriums"
    ],
    website: "https://www.uet.edu.pk",
    email: "info@uet.edu.pk",
    phone: "+92-42-9902-9202",
    admissionProcess: "Admission through UET Entry Test based on FSc marks",
    fees: {
      min: 100000,
      max: 250000,
      currency: "PKR"
    },
    image: null,
    isActive: true
  },
  {
    name: "NUST - National University of Sciences and Technology",
    location: {
      city: "Islamabad",
      state: "Islamabad Capital Territory",
      country: "Pakistan"
    },
    description: "NUST is Pakistan's top-ranked public university, known for excellence in engineering, sciences, and technology. It attracts the brightest students and maintains high international standards in research and education.",
    establishedYear: 1991,
    ranking: {
      national: 2,
      global: 401
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BE" },
      { name: "Electrical Engineering", duration: "4 years", degree: "BE" },
      { name: "Mechanical Engineering", duration: "4 years", degree: "BE" },
      { name: "Software Engineering", duration: "4 years", degree: "BE" },
      { name: "Business Administration", duration: "4 years", degree: "BBA" }
    ],
    facilities: [
      "Modern campus",
      "Research centers",
      "Innovation labs",
      "Digital library",
      "Sports complex",
      "Student housing",
      "Medical facilities"
    ],
    website: "https://www.nust.edu.pk",
    email: "info@nust.edu.pk",
    phone: "+92-51-9085-5000",
    admissionProcess: "Admission through NET (NUST Entry Test)",
    fees: {
      min: 300000,
      max: 600000,
      currency: "PKR"
    },
    image: null,
    isActive: true
  },
  {
    name: "Quaid-i-Azam University",
    location: {
      city: "Islamabad",
      state: "Islamabad Capital Territory",
      country: "Pakistan"
    },
    description: "QAU is Pakistan's premier public university, offering comprehensive programs in natural sciences, social sciences, and biological sciences. Its beautiful campus nestled in the Margalla Hills provides an ideal learning environment.",
    establishedYear: 1967,
    ranking: {
      national: 6,
      global: 801
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Physics", duration: "4 years", degree: "BS" },
      { name: "Chemistry", duration: "4 years", degree: "BS" },
      { name: "Biosciences", duration: "4 years", degree: "BS" },
      { name: "International Relations", duration: "4 years", degree: "BS" },
      { name: "Economics", duration: "4 years", degree: "BS" }
    ],
    facilities: [
      "Research laboratories",
      "Central library",
      "Hostels",
      "Sports facilities",
      "Mosque",
      "Medical center",
      "Conference halls"
    ],
    website: "https://www.qau.edu.pk",
    email: "info@qau.edu.pk",
    phone: "+92-51-9064-4000",
    admissionProcess: "Admission based on intermediate marks and entry test",
    fees: {
      min: 50000,
      max: 150000,
      currency: "PKR"
    },
    image: null,
    isActive: true
  },
  {
    name: "University of Peshawar",
    location: {
      city: "Peshawar",
      state: "Khyber Pakhtunkhwa",
      country: "Pakistan"
    },
    description: "University of Peshawar is one of the oldest universities in Pakistan, offering diverse programs in sciences, arts, and social sciences. It plays a crucial role in higher education in Khyber Pakhtunkhwa province.",
    establishedYear: 1950,
    ranking: {
      national: 10,
      global: 1601
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Business Administration", duration: "4 years", degree: "BBA" },
      { name: "Chemistry", duration: "4 years", degree: "BS" },
      { name: "Islamic Studies", duration: "4 years", degree: "BS" },
      { name: "Political Science", duration: "4 years", degree: "BS" }
    ],
    facilities: [
      "Multiple departments",
      "Central library",
      "Computer labs",
      "Sports facilities",
      "Hostels",
      "Museum",
      "Research centers"
    ],
    website: "https://www.uop.edu.pk",
    email: "info@uop.edu.pk",
    phone: "+92-91-9216-701",
    admissionProcess: "Admission based on intermediate marks and university entry test",
    fees: {
      min: 40000,
      max: 120000,
      currency: "PKR"
    },
    image: null,
    isActive: true
  },
  {
    name: "University of Balochistan",
    location: {
      city: "Quetta",
      state: "Balochistan",
      country: "Pakistan"
    },
    description: "University of Balochistan is the largest and oldest seat of higher learning in Balochistan province, offering quality education in various disciplines and serving as a center for research and cultural activities.",
    establishedYear: 1970,
    ranking: {
      national: 18,
      global: 2001
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Business Administration", duration: "4 years", degree: "BBA" },
      { name: "English Literature", duration: "4 years", degree: "BS" },
      { name: "Geology", duration: "4 years", degree: "BS" },
      { name: "Botany", duration: "4 years", degree: "BS" }
    ],
    facilities: [
      "Faculty buildings",
      "Library",
      "Computer labs",
      "Sports ground",
      "Hostels",
      "Auditorium",
      "Medical facilities"
    ],
    website: "https://www.uob.edu.pk",
    email: "info@uob.edu.pk",
    phone: "+92-81-921-1268",
    admissionProcess: "Admission based on intermediate marks and entry test",
    fees: {
      min: 35000,
      max: 100000,
      currency: "PKR"
    },
    image: null,
    isActive: true
  },
  {
    name: "Habib University",
    location: {
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan"
    },
    description: "Habib University is Pakistan's first liberal arts university, offering an American-style education with emphasis on critical thinking, creativity, and leadership. It features state-of-the-art facilities and diverse academic programs.",
    establishedYear: 2014,
    ranking: {
      national: 7,
      global: 1201
    },
    type: "Private",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Electrical Engineering", duration: "4 years", degree: "BSc" },
      { name: "Social Development & Policy", duration: "4 years", degree: "BS" },
      { name: "Communication & Design", duration: "4 years", degree: "BS" },
      { name: "Comparative Humanities", duration: "4 years", degree: "BS" }
    ],
    facilities: [
      "Modern campus",
      "Innovation labs",
      "Library and learning commons",
      "Sports facilities",
      "Maker space",
      "Performance spaces",
      "Student center"
    ],
    website: "https://www.habib.edu.pk",
    email: "admissions@habib.edu.pk",
    phone: "+92-21-111-042-424",
    admissionProcess: "Admission through Habib University Entrance Test and holistic review",
    fees: {
      min: 500000,
      max: 900000,
      currency: "PKR"
    },
    image: "/images/habib_university.webp",
    isActive: true
  },
  {
    name: "Fatima Jinnah Women University",
    location: {
      city: "Rawalpindi",
      state: "Punjab",
      country: "Pakistan"
    },
    description: "FJWU is Pakistan's first women's university in the public sector, dedicated to women's education and empowerment. It offers quality programs in sciences, arts, and professional disciplines.",
    establishedYear: 1998,
    ranking: {
      national: 14,
      global: 1801
    },
    type: "Public",
    affiliation: "HEC Pakistan",
    courses: [
      { name: "Computer Science", duration: "4 years", degree: "BS" },
      { name: "Software Engineering", duration: "4 years", degree: "BS" },
      { name: "Biotechnology", duration: "4 years", degree: "BS" },
      { name: "Mass Communication", duration: "4 years", degree: "BS" },
      { name: "Psychology", duration: "4 years", degree: "BS" }
    ],
    facilities: [
      "Multiple campuses",
      "Computer labs",
      "Science laboratories",
      "Library",
      "Sports complex",
      "Hostels",
      "Auditorium"
    ],
    website: "https://www.fjwu.edu.pk",
    email: "info@fjwu.edu.pk",
    phone: "+92-51-9292-381",
    admissionProcess: "Admission based on intermediate marks and entry test",
    fees: {
      min: 60000,
      max: 150000,
      currency: "PKR"
    },
    image: null,
    isActive: true
  }
];

async function seedUniversities() {
  try {
   
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/career-guidance');
    console.log('Connected to MongoDB');

    await University.deleteMany({});
    console.log('Cleared existing universities');

    const result = await University.insertMany(universities);
    console.log(`Successfully seeded ${result.length} universities`);
 
    result.forEach((uni, index) => {
      console.log(`${index + 1}. ${uni.name} - ${uni.location.city}, ${uni.location.state}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding universities:', error);
    process.exit(1);
  }
}

seedUniversities();
