
import { Course, User } from '../types';

export const MOCK_STUDENTS: User[] = [
  { id: 's2', name: 'Sarah Jenkins', email: 'sarah.j@university.edu', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'student' },
  { id: 's3', name: 'David Chen', email: 'd.chen@university.edu', avatar: 'https://i.pravatar.cc/150?u=david', role: 'student' },
  { id: 's4', name: 'Amara Okafor', email: 'amara.o@university.edu', avatar: 'https://i.pravatar.cc/150?u=amara', role: 'student' },
  { id: 's5', name: 'James Wilson', email: 'j.wilson@university.edu', avatar: 'https://i.pravatar.cc/150?u=james', role: 'student' },
  { id: 's6', name: 'Priya Patel', email: 'priya.p@university.edu', avatar: 'https://i.pravatar.cc/150?u=priya', role: 'student' },
  { id: 's7', name: 'Lucas Meyer', email: 'l.meyer@university.edu', avatar: 'https://i.pravatar.cc/150?u=lucas', role: 'student' },
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'CHM101',
    title: 'General Chemistry I',
    instructor: 'Dr. A. Mensah',
    thumbnail: '',
    modules: [
      {
        id: 'chm101-m1',
        title: 'Stoichiometry & Atomic Theory',
        description: 'Foundations of chemical reactions and atomic structure.',
        content: 'Stoichiometry involves using relationships between reactants and/or products in a chemical reaction to determine desired quantitative data.',
        videos: [
          {
            id: 'v1',
            title: 'Stoichiometry Lecture',
            url: 'https://www.youtube.com/watch?v=GleX8m0K-pE',
            duration: '15:20',
            thumbnail: '',
            attachments: [
              { 
                name: 'Atomic Theory Notes.pdf', 
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                timestamp: 1715424000000 
              }
            ]
          }
        ],
        attachments: [
          { 
            name: 'Stoichiometry Study Guide.pdf', 
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            timestamp: 1715424000000 
          }
        ]
      }
    ]
  },
  {
    id: 'COS101',
    title: 'Introduction to Computer Science',
    instructor: 'Dr. K. Obi',
    thumbnail: '',
    modules: []
  },
  {
    id: 'MTH101',
    title: 'Elementary Mathematics I',
    instructor: 'Prof. S. Ibrahim',
    thumbnail: '',
    modules: []
  },
  {
    id: 'PHY101',
    title: 'General Physics I (Mechanics)',
    instructor: 'Dr. T. Adebayo',
    thumbnail: '',
    modules: []
  },
  {
    id: 'BIO101',
    title: 'General Biology I',
    instructor: 'Prof. E. Okon',
    thumbnail: '',
    modules: []
  },
  {
    id: 'GST101',
    title: 'Use of English',
    instructor: 'Mrs. J. Smith',
    thumbnail: '',
    modules: []
  },
  {
    id: 'GST102',
    title: 'Philosophy & Human Existence',
    instructor: 'Dr. F. Nwosu',
    thumbnail: '',
    modules: []
  },
  {
    id: 'ENG101',
    title: 'Engineering Graphics',
    instructor: 'Engr. B. Williams',
    thumbnail: '',
    modules: []
  },
  {
    id: 'EEE101',
    title: 'Intro to Electrical Engineering',
    instructor: 'Dr. V. Gupta',
    thumbnail: '',
    modules: []
  }
];
