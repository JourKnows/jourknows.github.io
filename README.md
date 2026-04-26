# JourKnows

A modern, high-performance editorial platform featuring a TikTok-inspired dual-axis article deck, seamless PagesCMS integration, and optimized typography.

## Customizability

This repository was designed to be highly customizable for developers and publishers alike. If you are using this code for your own project:

- **Components:** The `LatestDeckViewer.tsx` powers the immersive editorial swiping experience.
- **Content:** Posts are managed effortlessly through the `src/content/` directory via PagesCMS.
- **Styling:** Tailored using standard TailwindCSS utilities.

Feel free to fork this project, modify the UI components, and adapt the architecture to fit your own unique publishing needs!

## License & Copyright (Dual-License Model)

To protect the hard work of the journalists while still giving back to the open-source community, this project operates under a split-licensing model.

### 1. The Codebase: GNU GPLv3 License

This project is built upon the [AstroPaper](https://github.com/satnaing/astro-paper) theme.

- The original AstroPaper source code remains under the **MIT License** (Copyright (c) 2023 Sat Naing).
- All modifications, new React components (such as the swipeable deck viewer), and the resulting combined software are licensed and distributed under the **GNU General Public License v3.0 (GPLv3)**.

You are free to copy, modify, and use the code architecture. However, under the terms of the GPLv3, if you use, modify, or distribute this code in your own project, your entire project must also be open-sourced under the same GPLv3 license.

### 2. The Content: All Rights Reserved

All editorial content, journalistic text, illustrations, and media assets located within the following directories are strictly **All Rights Reserved © 2026 JourKnows**:

- `src/content/blog/` (All Markdown articles)
- `public/` (All images, branding, and media)

These assets **MAY NOT** be reproduced, copied, republished, or distributed in any form without explicit written permission from the publisher. 

---

> **Note to Developers:** If you clone or fork this repository to build your own site, you must delete the contents of `src/content/blog/` and the original images in `public/` and replace them with your own original content.
