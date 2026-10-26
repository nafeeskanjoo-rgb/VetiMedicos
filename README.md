# 🐾 VetiMedicos - Veterinary & Pet Care Portal

VetiMedicos (#VetiCare) ka aik modern, fixed-screen (100vh lock, no scroll) portal hai jo HTML5, CSS3 aur JavaScript me banaya gaya hai. Isme Firebase Authentication, Realtime Database, aur On-Duty Doctors Live Board configured hai.

---

## 🩺 Active Doctors On Duty (Live Shift Roster)

VetiMedicos clinic me is waqt duty dene wale Doctors ki tafseelat:

| Dr. Name | Qualifications & Specialty | Department & Room | Live Duty Status | Shift Timings |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Farhan Qureshi** | DVM, M.Phil Surgery (Chief Surgeon) | Dept of Surgery, Suite 101 | 🟢 **On Duty Now** | 08:00 AM - 04:00 PM |
| **Dr. Ayesha Malik** | DVM, Canine Medicine Specialist | Canine OPD Block A, Room 103 | 🔵 **In Consultation** | 10:00 AM - 06:00 PM |
| **Dr. Muhammad Usman**| DVM, Feline (Cat) Specialist | Cat Care Unit, Room 105 | 🟢 **On Duty Now** | 09:00 AM - 05:00 PM |
| **Dr. Zainab Tariq** | DVM, Trauma & Critical Care | 24/7 Emergency ICU, OT-2 | 🟡 **In Emergency Surgery** | 12:00 PM - 08:00 PM |
| **Dr. Bilal Ahmed** | DVM, Animal Nutritionist | Dietary Clinic, Room 108 | 🟢 **On Duty Now** | 11:00 AM - 07:00 PM |
| **Dr. Sana Rauf** | DVM, Avian & Exotic Species | Exotic Aviary Care, Room 110 | ⚪ **Shift Starts 04:00 PM** | 04:00 PM - 11:00 PM |

---

## 🌟 Roster Modal Features:
1. **Live Search**: Kisi bhi doctor ko unke naam, specialty, ya room number se search karein.
2. **Category Filters**: "All", "🟢 On Duty Now", "🟡 In Surgery", "🔵 In Consultation", aur "⚪ Upcoming Shift" ke hisaab se filter karein.
3. **Instant Token Generator**: "Consult Now 💬" par click karke foran OPD Token number hasil karein.
4. **Multiple Triggers**: 
   - Navbar me **"Doctors on Duty 🟢"** link par click karke.
   - Hero section me **"Doctors on Duty"** button se.
   - Hero highlights pill `🩺 48 Certified Doctors (🟢 4 ON DUTY)` par click karke.
   - Doctor Login form ke andar mojood link se.

---

## 📁 File Structure

```text
D:\#VetiCare/
├── index.html                 # Main portal with Doctors Duty Roster Modal
├── login.html                 # Direct login alias
├── README.md                  # Complete documentation & Doctor Roster
├── css/
│   └── style.css              # Custom styling, duty cards, and animations
├── js/
│   ├── firebase-config.js     # Firebase credentials & Realtime Database sync
│   └── app.js                 # Doctors roster rendering, search, filters & tokens
└── assets/
    └── images/
        └── pets_hero.jpg      # High-res cute pets group image
```

---

## 🌐 Kaisay Check / Open Karein?

- Browser me open karein: **[index.html](file:///D:/%23Projects%202026/#VetiCare/index.html)**
- Ya live server par dekhein: **`http://localhost:8080/`**
