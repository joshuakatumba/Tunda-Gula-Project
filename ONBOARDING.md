# Tunda Gula: Setup Guide

Welcome! This guide will help you get the Tunda Gula platform running on your own computer. You do not need to be an expert to do this. Just follow these steps in order.

---

## 1. What You Need First

Before we start, you need to download two standard programs onto your computer.

### For Mac Users:
1. **Docker Desktop:** This is the engine that runs the platform. [Download it here for Mac](https://www.docker.com/products/docker-desktop/).
2. **Git:** This helps you download the project code. Mac usually has it already, but if a popup asks you to install "command line tools", say yes.

### For Windows Users:
1. **Docker Desktop:** The engine that runs the platform. [Download it here for Windows](https://www.docker.com/products/docker-desktop/). When installing, if it asks to use "WSL 2", say yes.
2. **Git for Windows:** This lets you download the code. [Download it here](https://gitforwindows.org/).

*Note: Once you install Docker Desktop, make sure to open it so it is running in the background.*

---

## 2. Download the Project

Open your computer's terminal (search for "Terminal" on Mac, or "Git Bash" on Windows). 

Type this exact command and press Enter:
```bash
git clone https://github.com/joshuakatumba/Tunda-Gula-Project.git
```

Once it finishes downloading, move into the project folder by typing:
```bash
cd "Tunda Gula"
```

---

## 3. Set Up the Configuration

The platform needs a settings file to know how to connect its internal parts. We have provided a template for you.

Run this command to copy the template and make your official settings file:
```bash
cp .env.example .env
```
*(If you are using the standard Windows Command Prompt instead of Git Bash, type `copy .env.example .env` instead).*

---

## 4. Start the Platform

Now you are ready to turn everything on. Make sure Docker Desktop is open and running in the background.

In your terminal, you need to run three specific commands to start all the parts of the platform.

Type these commands one by one, pressing Enter after each:

```bash
cd backend
docker compose up --build

cd ../frontend
docker compose up --build

cd ..
docker compose up --build
```

**What is happening now?**
The system is automatically building the database, the backend engine, and the visual website. This might take a few minutes the very first time. You will see a lot of text scrolling by—this is normal.

---

## 5. View the Website

Once the text stops scrolling and says things are running, you can view the platform!

Open your web browser (like Chrome or Safari) and go to:
- **The Main Website:** `http://localhost:3000`
- **The Staff Dashboard:** `http://localhost:8001/admin`

---

## 6. How to Stop the Platform

When you are done testing or working, you need to turn the platform off so it doesn't use up your computer's battery and memory.

Go back to the terminal where the text was scrolling and press **Ctrl + C** on your keyboard. 

If that doesn't work, open a new terminal window, go to the project folder (`cd "Tunda Gula"`), and type:
```bash
docker compose down
```

---

## Troubleshooting

- **Port in Use:** If you see an error saying a "port" is already in use, it means you have another program running on your computer that is blocking Tunda Gula. Restarting your computer usually fixes this.
- **Starting Fresh:** If you ever mess up and want to completely wipe the platform's memory and start from scratch, type `docker compose down -v`.
