# Tutorial — MejoraRedmi14c v5.0

Step-by-step guide to optimize your Redmi 14C from scratch.

---

## Step 1: Install ADB

### Windows

1. Download [platform-tools](https://dl.google.com/android/repository/platform-tools-latest-windows.zip)
2. Extract it into `C:\platform-tools`
3. Add it to the PATH:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to the **Advanced** tab → **Environment Variables**
   - In **System variables**, find `Path`, click **Edit**
   - Click **New** → type `C:\platform-tools`
   - Click OK on all windows
4. Open a **new** terminal (Git Bash or CMD) and verify:
   ```bash
   adb version
   ```
   If it shows something like `Android Debug Bridge version 1.0.xx` → you're all set!

### Mac

```bash
brew install android-platform-tools
adb version
```

### Linux

```bash
# Debian/Ubuntu
sudo apt install android-sdk-platform-tools

# Arch
sudo pacman -S android-tools

# Fedora
sudo dnf install android-tools
```

---

## Step 2: Prepare your phone

### Enable Developer Options

1. Open **Settings** → **About phone**
2. Tap on **HyperOS version** (or **Build number**) **7 times**
3. You will see a message: "You are now a developer"

### Enable USB Debugging

1. Open **Settings** → **Additional settings** → **Developer options**
2. Enable **USB Debugging**
3. (Optional) Enable **Install via USB** if the option appears

### Unlink your Xiaomi Account (IMPORTANT)

> ⚠️ If you're going to disable Xiaomi apps, **sign out of your Mi Account** first.
> If you disable the account package while logged in, the phone might ask 
> for a verification on the lock screen.

1. **Settings** → **Accounts & sync** → your Mi account
2. Tap **Sign out**

---

## Step 3: Connect your phone

1. Connect the phone via USB (use a cable capable of data transfer, not just charging)
2. A popup will appear on your phone: **"Allow USB debugging?"**
3. Check **"Always allow from this computer"** → **OK**

### Verify connection

```bash
adb devices
```

You should see something like this:
```
List of devices attached
XXXXXXXX    device
```

If it says `unauthorized` → check your phone, you need to allow it.
If nothing appears → check the cable and ensure USB debugging is enabled.

---

## Step 4: Clone the repo

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
chmod +x *.sh
```

---

## Step 5: Run the optimizer

```bash
./optimizer.sh
```

### What happens when you run it?

The script has a **guided flow**:

```
┌─────────────────────────────────────────┐
│  STEP 1: Connect phone                  │
│  → Searches for devices automatically   │
│  → Waits until you connect              │
│  → Verifies USB authorization           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  STEP 2: Verify connection              │
│  → Shows device info                    │
│  → Quick status (battery, RAM, apps)    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  STEP 3: Benchmark BEFORE               │
│  → CPU benchmark (10k iterations)       │
│  → RAM (usage, available, swap)         │
│  → Storage                              │
│  → Battery and temperature              │
│  → Installed and disabled apps          │
│  → Background services                  │
│  → Network and connectivity             │
│  → Diagnosis: WHAT IS SLOWING IT DOWN   │
│  → Auto-fix for detected problems       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  MAIN MENU                              │
│  → All optimization options             │
│  → Benchmark AFTER to compare           │
└─────────────────────────────────────────┘
```

---

## The Benchmark in detail

The benchmark runs **10 sections** and generates a report:

| Section | What it measures |
|---|---|
| 1. Device | Model, Android, HyperOS, SoC, uptime |
| 2. CPU | Load average, frequency, benchmark (10k iterations), top processes |
| 3. RAM | Total, used, available, free, cached, swap, top apps by RAM |
| 4. Storage | Used, available, cache size |
| 5. Battery | Level, temperature, voltage, health |
| 6. Apps | Total, system, third-party, disabled, wakelocks |
| 7. Services | Active processes, background services, receivers |
| 8. Network | WiFi, signal, scanning, roaming, DNS |
| 9. Configuration | Animations, GPU, resolution, DPI, SELinux |
| 10. Diagnosis | **Identifies slowdowns and auto-fixes them** |

### What does it detect as a problem?

| Problem | Auto-fix |
|---|---|
| Active Bloatware | Suggests running a profile |
| High RAM (>80%) | Automatically force-stops heavy apps |
| High Temperature (>40°C) | Suggests letting it cool down |
| Full Storage (>85%) | Cleans cache automatically |
| WiFi scanning active | Disables it automatically |
| Default Animations (1x) | Adjusts them to 0.5x automatically |
| GPU not forced | Forces it automatically |
| Large Cache (>2GB) | Performs a partial clean |
| Many Processes (>400) | Closes background apps |
| Uptime >7 days | Suggests a reboot |

---

## Recommended order

### First time

```bash
./optimizer.sh
# 1. Connect phone (automatic)
# 2. Verify connection (automatic)
# 3. Benchmark BEFORE → select "Y"
# 4. Read the diagnosis and auto-fixes
# 5. Menu → option 10 (Rescue Points) → create backup
# 6. Menu → option 4 (Balanced) → apply
# 7. Menu → option 2 (Benchmark AFTER) → compare
# 8. Menu → option 13 (Verification Test) → confirm
```

### After optimizing

```bash
./optimizer.sh
# 1. Connect (automatic)
# 2. Benchmark AFTER → compare with BEFORE
# 3. For more performance: apply Performance or Gaming profile
# 4. Verification test → check the score
```

---

## Full Menu

```
📊 Benchmark:
  1) 🔍 Benchmark BEFORE (diagnosis)
  2) 🔍 Benchmark AFTER (verify)

🚀 Profiles:
  3) 🚀 Performance (aggressive)
  4) 📱 Balanced (recommended)
  5) 🔋 Battery (power save)
  6) 🎮 Gaming (max performance)

⚡ Advanced optimization:
  7) 🧈 Smoothness (baseline profiles)
  8) 🌐 Network tweaks
  9) 💾 Memory tweaks

🔧 Tools:
 10) 🔧 Maintenance
 11) 🔍 Detailed Diagnosis
 12) 💾 Rescue Points
 13) 🧪 Verification Test

🚨 Emergency:
 14) 🚨 Restore everything

🔄 r) Reconnect device
```

---

## Something went wrong?

### Restore everything

```bash
./emergencia.sh
```

This will:
1. Offer you to restore from a rescue point (if one exists)
2. If not, restore everything manually

### If the phone gets stuck in a bootloop

If your phone enters a bootloop after optimizing:
1. Wait for it to restart itself 5 times
2. It will automatically enter Recovery Mode
3. Perform a **Factory Reset** from there
4. **This is why you must always create a rescue point beforehand**

---

## Monthly maintenance

Once a month, run:

```bash
./optimizer.sh
# Menu → option 10 (Maintenance)
```

This will:
- Clean the cache
- Close background apps
- Show you the current system status

---

## Frequently Asked Questions

### Can I still receive OTA updates?
Yes. The scripts use `pm disable-user` instead of `pm uninstall`. The apps are still there, just asleep. After an OTA update, some may get re-enabled — simply re-run your profile.

### Do I void my warranty?
No. Everything is done via ADB without root. If you need to send your phone to a service center, run `./emergencia.sh` beforehand and it will be 100% factory stock.

### Is the Gaming profile safe?
Yes, but:
- Icons will look bigger (due to reduced resolution)
- After gaming, restart the phone to revert to normal
- A rescue point is created automatically before applying

### Can I use multiple profiles?
Yes, but not at the same time. If you apply Performance and later want Battery, first run `./emergencia.sh` and then apply the new profile.

### Does it work on other Xiaomi phones?
The animations, GPU, network, and memory tweaks work on any Android. The bloatware list is optimized for Redmi 14C / HyperOS — on other models, some packages may not exist (it doesn't matter, it simply skips them).

### What exactly does the benchmark do?
It runs 10 sections measuring CPU, RAM, storage, battery, apps, services, network, and settings. It identifies what's slowing down your phone and auto-corrects what it can (closes apps, clears cache, disables WiFi scanning, adjusts animations, forces GPU).

### Does the benchmark drain battery?
Minimally. It takes ~30 seconds and uses read operations. It does not affect phone performance.

### What about thermal management?
Since v5.0, thermal management is **NO longer disabled by default**. This is safer for your device. It will only be disabled if you explicitly pass the `--no-thermal` flag when running the mega-optimizer. Without the flag, the phone's thermal control system remains active, protecting against overheating. If you need maximum performance and accept the risk, run: `./mega-optimizer.sh --no-thermal`

---

## Quick Summary

```
1. Install ADB
2. Enable USB debugging on phone
3. Connect via USB, authorize
4. git clone + cd MejoraRedmi14c
5. ./optimizer.sh
6. Guided script: connect → verify → benchmark → menu
7. Create rescue point → try Balanced → verify
8. If something fails: ./emergencia.sh
```
