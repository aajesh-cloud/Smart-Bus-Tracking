# Demo Credentials — Smart Bus Tracking

These are the **development/demo users** created by running:

```bash
cd backend
node _seed-demo-users.js
```

The script is **idempotent**: running it again will not overwrite or duplicate existing
users — it just skips any emails that already exist in the DB.

---

## 📋 Complete Login Table

| Role       | Where to log in 📍                        | Email                             | Password          | Notes                                                                         |
|------------|-------------------------------------------|-----------------------------------|-------------------|-------------------------------------------------------------------------------|
| 👤 Admin   | Passenger App → Login → `/admin`          | `admin@smartbus.in`               | `Admin@123`      | Full CRUD for Buses/Routes/Stops/Drivers; can assign buses and run Build Path |
| 🚕 Driver  | **Driver App** (`mobile-driver/`) Login   | `driver.rajesh@smartbus.in`       | `Driver@123`     | License: `KA-01/2022/123456` — assign a bus to this user in Admin → Drivers  |
| 🚕 Driver  | **Driver App** (`mobile-driver/`) Login   | `driver.priya@smartbus.in`        | `Driver@123`     | License: `KA-01/2023/987654`                                                  |
| 🧍 Passenger | Passenger App → Login                   | `passenger.aarav@smartbus.in`     | `Passenger@123`  | Fav-stop notifications, live map, search                                      |
| 🧍 Passenger | Passenger App → Login                   | `passenger.ananya@smartbus.in`    | `Passenger@123`  |                                                                               |

---

## ⚠️ Important Notes

1. **These are DEMO credentials.** Change the passwords before deploying to a real
   Render/Vercel production environment.
2. **Admin → Drivers page:** after seeding, go to `/admin/drivers` and use the
   **Assign Bus** button to attach each driver to a Bus — otherwise the Driver App
   will tell them "No bus assigned" on login.
3. **To reset:** if you want completely fresh users, open MongoDB Atlas Compass →
   `smart_bus_tracking` → `users` collection → delete the users you want, then
   re-run `node _seed-demo-users.js`.
4. **Security:** Registration via the public `/api/auth/register` endpoint always
   creates `role: "passenger"` on the server — you **cannot** create admin/driver
   accounts via passenger registration UI (by design, to prevent role escalation).
