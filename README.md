# Agona Nyakrom Community Website

This repository contains the full source code for the Agona Nyakrom community website.  
It includes a public visitor-facing site, a custom backend API, and an admin panel.

## Folder Structure

- /frontend — React + Vite site for visitors
- /backend — Node.js + Express + PostgreSQL custom API
- /admin — React + Vite admin panel for managing content
- /docs — Documentation (optional)

## Project Goal
To create a dynamic, content-driven community platform where admins can manage
history, clans, news, obituaries, landmarks, hall of fame, homepage settings,
and more through a secure custom admin panel.

## Homepage Blocks
The public homepage is powered by `GET /api/public/homepage`, which now returns an
ordered `blocks` array used to render the redesigned sections. Administrators
manage these blocks from the admin “Homepage Settings” screen (`/admin/homepage-sections`)
to control ordering, content, and publishing status.
