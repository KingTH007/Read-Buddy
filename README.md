# 📚 Read-Buddy

**Reading Comprehension for Elementary Students**

Read-Buddy is an innovative educational platform designed to enhance reading comprehension skills for elementary students through interactive stories, AI-generated quizzes, and engaging learning activities.

## 🌟 Features

### For Teachers
- **📖 Story Management**: Upload PDF stories and automatically generate comprehension questions using AI
- **🏫 Class Management**: Create and manage classes with unique codes for student access
- **👥 Student Tracking**: Monitor student progress and performance in real-time
- **🤖 AI Integration**: Automatic question generation and story formatting using OpenAI
- **📊 Analytics**: Track student reading speed, comprehension scores, and overall progress

### For Students
- **📚 Interactive Reading**: Read teacher-uploaded stories with AI-formatted content
- **❓ Smart Quizzes**: Answer AI-generated comprehension questions
- **🎮 Learning Activities**: Engage with "Read and Understand" activities in Easy, Medium, and Hard modes
- **📈 Progress Tracking**: View personal reading statistics and achievements
- **🔊 Text-to-Speech**: Audio support for better learning accessibility

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Server**: Express.js with Socket.io for real-time communication
- **Database**: PostgreSQL with Supabase integration
- **Authentication**: bcrypt for password hashing
- **AI Integration**: OpenAI API for question generation and story formatting
- **Image Generation**: Ghibli-style AI image generation
- **Real-time Updates**: Socket.io for live student progress tracking

### Frontend (Vanilla HTML/CSS/JavaScript)
- **Responsive Design**: Mobile-first approach with Bootstrap integration
- **Interactive UI**: Dynamic story cards, progress bars, and real-time notifications
- **PDF Processing**: Client-side PDF text extraction using PDF.js
- **Text-to-Speech**: Browser-native speech synthesis
- **Real-time Communication**: Socket.io client for live updates

### Database Schema
```sql
-- Teachers table
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Classes table
CREATE TABLE class (
    code INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    no_students INTEGER DEFAULT 0,
    teacher_id INTEGER REFERENCES teachers(id)
);

-- Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    code INTEGER REFERENCES class(code)
);

-- Stories table
CREATE TABLE teach_story (
    story_id SERIAL PRIMARY KEY,
    teach_id INTEGER REFERENCES teachers(id),
    storyname VARCHAR(255),
    storycontent TEXT,
    storyquest TEXT,
    storyimage VARCHAR(500)
);

-- Results table
CREATE TABLE s_storyresult (
    student_id INTEGER REFERENCES students(id),
    story_id INTEGER REFERENCES teach_story(story_id),
    read_speed DECIMAL,
    read_score INTEGER,
    final_grade DECIMAL
);
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Supabase account (for cloud database)
- OpenAI API key
- RapidAPI key (for AI services)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/KingTH007/Read-Buddy.git
cd Read-Buddy
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_supabase_database_url
RAPIDAPI_KEY=your_rapidapi_key
OPENAI_API_KEY=your_openai_api_key
```

4. **Database Setup**
```bash
# Import the database schema
psql -h your_host -U your_user -d your_database -f backup.sql
```

5. **Start the server**
```bash
npm start
```

6. **Access the application**
- Open `http://localhost:5000` in your browser
- The frontend will be served from the `Front-end` directory

## 📁 Project Structure

```
Read-Buddy/
├── Back-end/
│   ├── js/
│   │   ├── server.js              # Main Express server
│   │   ├── home-func.js           # Home page functionality
│   │   ├── stud-func.js           # Student interface logic
│   │   ├── teach-func.js           # Teacher interface logic
│   │   ├── story-comp.js           # Story comprehension logic
│   │   ├── header-func.js          # Header navigation
│   │   └── rAu.js                  # Read and Understand activity
│   └── json/
│       ├── package.json           # Backend dependencies
│       └── rau-stories.json        # Pre-defined stories
├── Front-end/
│   ├── html/
│   │   ├── home-page.html         # Landing page
│   │   ├── teacher-front.html     # Teacher dashboard
│   │   ├── student-front.html     # Student dashboard
│   │   ├── story-comp.html        # Story comprehension interface
│   │   └── learn-act.html         # Learning activities
│   ├── css/
│   │   ├── home-page.css          # Landing page styles
│   │   ├── teacher-style.css      # Teacher interface styles
│   │   ├── student-style.css      # Student interface styles
│   │   ├── story-style.css        # Story comprehension styles
│   │   ├── learn-act.css          # Learning activity styles
│   │   └── header.css             # Header navigation styles
│   └── asset/
│       ├── Logo.png               # Application logo
│       ├── trans-logo.png         # Transparent logo
│       └── *.png                  # Feature images
├── supabase/
│   ├── config.toml                # Supabase configuration
│   └── functions/
│       └── readbuddy-api/
│           ├── index.ts           # Supabase Edge Function
│           └── deno.json          # Deno configuration
├── backup.sql                     # Database backup
├── package.json                   # Main project dependencies
└── README.md                      # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /register` - Teacher registration
- `POST /login` - Teacher login
- `POST /student-login` - Student login with class code

### Story Management
- `POST /save-story` - Save uploaded story
- `GET /get-stories/:teacherId` - Get teacher's stories
- `GET /get-student-stories/:studentId` - Get stories for student
- `GET /get-story/:id` - Get specific story
- `PUT /update-story/:id` - Update story content

### Class Management
- `GET /get-classes/:teacher_id` - Get teacher's classes
- `GET /get-students/:code` - Get students in class
- `DELETE /delete-class/:code` - Delete class
- `DELETE /delete-student/:id` - Remove student

### AI Services
- `POST /api/generate-questions` - Generate comprehension questions
- `POST /api/format-story` - Format story text
- `POST /api/generate-image` - Generate story images

### Results
- `POST /save-result` - Save student performance data

## 🎯 Key Features Explained

### AI-Powered Question Generation
The system uses OpenAI's GPT-4 to automatically generate 20 multiple-choice comprehension questions from uploaded stories, ensuring educational relevance and appropriate difficulty levels.

### Real-time Progress Tracking
Socket.io enables live updates when students join classes or complete activities, allowing teachers to monitor engagement in real-time.

### Adaptive Learning Activities
The "Read and Understand" feature provides three difficulty levels (Easy, Medium, Hard) with pre-defined stories and questions designed for elementary students.

### PDF Processing
Client-side PDF text extraction allows teachers to upload any PDF story, which is automatically processed and formatted for optimal reading comprehension.

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Supabase** - Backend-as-a-Service
- **Socket.io** - Real-time communication
- **bcrypt** - Password hashing
- **OpenAI API** - AI question generation
- **RapidAPI** - AI image generation

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with Bootstrap
- **JavaScript (ES6+)** - Client-side logic
- **PDF.js** - PDF processing
- **Font Awesome** - Icons
- **Google Fonts** - Typography

### Development Tools
- **Supabase CLI** - Local development
- **Deno** - Edge functions runtime
- **Git** - Version control

## 📊 Performance Metrics

The system tracks comprehensive reading analytics:
- **Reading Speed**: Words per minute (WPM)
- **Comprehension Score**: Percentage of correct answers
- **Final Grade**: Weighted combination of speed and comprehension
- **Time Tracking**: Reading duration and question response time

## 🔒 Security Features

- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- SQL injection prevention with parameterized queries
- Secure API key management

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy to your preferred hosting platform
4. Update CORS settings for production domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **KingTH007** - *Initial work* - [GitHub](https://github.com/KingTH007)

## 🙏 Acknowledgments

- OpenAI for AI question generation capabilities
- Supabase for backend infrastructure
- Bootstrap for responsive UI components
- PDF.js for client-side PDF processing

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

**Read-Buddy** - Making reading comprehension fun and engaging for elementary students! 📚✨