<!-- config
{
  // Identity
  "id": "template-case",
  "caseOrder": 100,
  "slugByLocale": {
    "en": "template-case",
    "he": "template-case"
  },
  "socialImage": {
    "en": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&h=675&auto=format&fit=contain&bg=111111",
    "he": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&h=675&auto=format&fit=contain&bg=111111"
  },

  // Localized Metadata
  "title": {
    "show": true,
    "en": "Making Portfoliable",
    "he": "בונים את Portfoliable"
  },
  "shortDesc": {
    "show": true,
    "en": "A little behind-the-scenes look of the open-source project.",
    "he": "מבט קצר מאחורי הקלעים של פרויקט הקוד הפתוח."
  },
  "readTime": {
    "en": "1 min",
    "he": "דקה"
  },
  "kicker": {
    "en": "2026",
    "he": "2026"
  },

  // Thumbnail and Cover
  "thumbSrc": {
    "en": "src/content/cases/template-case/cover.png",
    "he": "src/content/cases/template-case/he-cover.png"
  },
  "thumbCategory": "desktop",
  "thumbBrand": "apple",
  "thumbModel": "Apple MacBook Air M5",
  "thumbColor": "Apple iMac 24 Silver",
  "showCover": true,

  // Summary Experience (config-driven)
  "showSummary": true,
  "summary": {
    "en": "Add an executive summary for this case.",
    "he": "הוסיפו תקציר מנהלים עבור הקייס הזה."
  },
  "summaryProps": {
    "text": {
      "en": "Add concise impact details, launch scope, and operational confidence outcomes.",
      "he": "הוסיפו פרטי השפעה תמציתיים, היקף השקה ותוצאות של ביטחון תפעולי."
    },
    "active": true,
    "labelHeader": {
      "en": "Case Snapshot",
      "he": "תמונת מצב"
    },
    "showMetrics": true,
    "ariaLabel": {
      "en": "Case summary with key metrics",
      "he": "תקציר קייס עם מדדי מפתח"
    },
    "metrics": [
      {
        "value": "4",
        "label": {
          "en": "Core principles",
          "he": "עקרונות ליבה"
        },
        "variant": "default",
        "ariaLabel": {
          "en": "Four core principles",
          "he": "ארבעה עקרונות ליבה"
        }
      },
      {
        "value": "1",
        "label": {
          "en": "CLI command",
          "he": "פקודת CLI"
        },
        "variant": "default",
        "ariaLabel": {
          "en": "One command to scaffold a case",
          "he": "פקודה אחת ליצירת תבנית לקייס"
        }
      },
      {
        "value": "3",
        "label": {
          "en": "Built-in views",
          "he": "תצוגות מובנות"
        },
        "variant": "default",
        "ariaLabel": {
          "en": "Three built-in views",
          "he": "שלוש תצוגות מובנות"
        }
      },
      {
        "value": "100%",
        "label": {
          "en": "Markdown-driven",
          "he": "מונע Markdown"
        },
        "variant": "default",
        "ariaLabel": {
          "en": "Content authored in markdown",
          "he": "תוכן שנכתב ב-Markdown"
        }
      }
    ]
  },

  // Reader Experience
  "showReader": true,
  "showToc": true,
  "showNavigator": true,

  // Audio Experience
  "audioLabel": {
    "en": "Case Audio Summary",
    "he": "תקציר שמע לקייס"
  },
  "audioSrc": {
    "en": "src/content/cases/template-case/template-audio.mp3",
    "he": ""
  },
  "showPlayer": true,

  // Visibility and Protection
  "visibility": {
    "web": true,
    "crawlers": true,
    "ai": true,
    "locales": {}
  },
  "isProtected": false,
  "isUnlocked": false,

  // Social
  "social": {
    "share": {
      "enabled": true,
      "icon": "share",
      "icon-variant": "outline",
      "tooltip": {
        "en": "Share this case link",
        "he": "שיתוף קישור לקייס הזה"
      }
    },
    "linkedin": {
      "enabled": true,
      "icon": "linkedin",
      "icon-variant": "outline",
      "tooltip": {
        "en": "Share on LinkedIn",
        "he": "שיתוף בלינקדאין"
      }
    },
    "x": {
      "enabled": true,
      "icon": "x",
      "icon-variant": "outline",
      "tooltip": {
        "en": "Share on X",
        "he": "שיתוף ב-X"
      }
    },
    "facebook": {
      "enabled": true,
      "icon": "facebook",
      "icon-variant": "outline",
      "tooltip": {
        "en": "Share on Facebook",
        "he": "שיתוף בפייסבוק"
      }
    },
    "links": {
      "linkedin": "",
      "x": "",
      "facebook": ""
    }
  },

  // Actions
  "actions": {
    "primary": {
      "enabled": true,
      "variant": "primary",
      "icon": "",
      "icon-variant": "",
      "label": {
        "en": "Watch presentation",
        "he": "צפייה במצגת"
      },
      "tooltip": {
        "en": "Open walkthrough video",
        "he": "פתיחת סרטון walkthrough"
      },
      "url": {
        "en": "",
        "he": ""
      },
      "videoSrc": {
        "en": "src/content/cases/template-case/template-video.mp4",
        "he": ""
      },
      "vttSrc": {
        "en": "",
        "he": ""
      },
      "imageAlt": {
        "en": "",
        "he": ""
      },
      "ariaLabel": {
        "en": "",
        "he": ""
      }
    },
    "secondary": {
      "enabled": true,
      "variant": "secondary",
      "icon": "",
      "icon-variant": "",
      "label": {
        "en": "Repository",
        "he": "מאגר"
      },
      "tooltip": {
        "en": "Open repo on GitHub",
        "he": "פתיחת המאגר ב-GitHub"
      },
      "url": {
        "en": "https://github.com/portfoliablejs/portfoliable",
        "he": "https://github.com/portfoliablejs/portfoliable"
      },
      "imageAlt": {
        "en": "",
        "he": ""
      },
      "ariaLabel": {
        "en": "",
        "he": ""
      }
    },
    "tertiary": {
      "enabled": true,
      "variant": "tertiary",
      "label": {
        "en": "Visit website",
        "he": "ביקור באתר"
      },
      "tooltip": {
        "en": "Get to know this project",
        "he": "להכיר את הפרויקט הזה"
      },
      "url": {
        "en": "https://www.portfoliable.js.org/",
        "he": "https://www.portfoliable.js.org/"
      },
      "has-image": false,
      "image-src": "",
      "image-alt": "",
      "imageAlt": {
        "en": "",
        "he": ""
      },
      "ariaLabel": {
        "en": "",
        "he": ""
      }
    }
  },

  // Custom Buttons
  "customButtons": [],
}
-->

<!-- lang:en -->
# Making Portfoliable
Portfoliable started from a simple belief: brilliant work deserves a **clear, fast, and elegant** way to be presented online.[^next-1]

Instead of spending weeks wiring layouts, routing, and content structure, you can focus on narrative, outcomes, and craft. This template is a practical behind-the-scenes case that explains the project and demonstrates markdown capabilities in one place.

## The problem we saw
Designers, developers, researchers, and teams often face the same friction:

1. Building a portfolio from scratch takes too long.
2. Generic templates hide the story behind the work.
3. Content gets fragmented across tools and file formats.
4. Accessibility and multilingual support are usually afterthoughts.

> Portfolios should be authored like products: intentional, reusable, and maintainable.

## The solution
Portfoliable is an open-source portfolio builder with a structured case system, reusable UI primitives, and a markdown-first authoring workflow. [^next-2]

### Core principles
- **Author first:** write once, publish confidently.
- **Design-system driven:** render through Valence components.
- **Content as source of truth:** your cases live in versioned files.
- **Accessible by default:** motion, contrast, and reading controls are built in.

### What this gives you
- Fast project setup with opinionated defaults.
- Flexible case pages with TOC, summary, media, and navigation.
- Localizable content with language-aware metadata.
- Repeatable CLI workflows for teams.

---

## CLI workflow
Create a new case in seconds:

```bash
npm run portfoliable-create-case -- --name "Checkout Revamp"
```

Then iterate in your editor:

- update metadata in the config block
- write your story in markdown
- preview with the app runtime

## Example config snippet
```json
{
  "id": "checkout-revamp",
  "title": { "en": "Checkout Revamp" },
  "showToc": true,
  "showSummary": true
}
```

## Markdown features used in this template
The table below maps common content patterns used in real case studies:

| Feature | Why it matters | Example |
| --- | --- | --- |
| Headings | Scannable narrative structure | `## Context` |
| Emphasis | Highlight key decisions | `**impact**`, `*tradeoff*` |
| Code blocks | Explain implementation details | fenced code with language |
| Tables | Compare options and outcomes | decision matrix |
| Lists | Communicate steps and priorities | ordered + unordered |
| Footnotes | Add nuance without noise | references and caveats |

## Decision log
Term
: A product-quality portfolio experience

Constraint
: Keep authoring simple enough for non-developers

Tradeoff
: Favor conventions over unlimited customization

## Delivery checklist
- [x] Case schema with localized fields
- [x] Reader + summary + navigator composition
- [x] Markdown-based storytelling
- [ ] Publish-ready production content for every locale


## Notes
You can start minimal and scale up later. ~~Perfect~~ practical documentation beats waiting for ideal conditions.

Learn more:
- [Portfoliable Website](https://www.portfoliable.js.org/)
- [Portfoliable Repository](https://github.com/portfoliablejs/portfoliable)

This case is intentionally concise, but extensible.[^next-3]

[^next-1]: Add sections for context, constraints, explorations, outcomes, metrics, and retrospective when adapting this template for production.
[^next-2]: Add sections for context, constraints, explorations, outcomes, metrics, and retrospective when adapting this template for production.
[^next-3]: Add sections for context, constraints, explorations, outcomes, metrics, and retrospective when adapting this template for production.

<!-- lang:he -->
# בונים את Portfoliable
Portfoliable נולד מתוך אמונה פשוטה: עבודה מעולה ראויה להצגה ברורה, מהירה ואלגנטית ברשת.[^next-he-1]

במקום להשקיע שבועות בחיבור תבניות, ניתוב ומבנה תוכן, אפשר להתמקד בסיפור, בתוצאות ובאיכות הביצוע. התבנית הזו היא קייס קצר מאחורי הקלעים שמסביר את הפרויקט ומדגים יכולות Markdown במקום אחד.

## הבעיה שזיהינו
מעצבים, מפתחים, חוקרים וצוותים מתמודדים שוב ושוב עם אותם חסמים:

1. בניית פורטפוליו מאפס לוקחת יותר מדי זמן.
2. תבניות כלליות מסתירות את הסיפור שמאחורי העבודה.
3. התוכן מתפזר בין כלים וקבצים שונים.
4. נגישות ורב-לשוניות בדרך כלל מגיעות מאוחר מדי.

> פורטפוליו צריך להיכתב כמו מוצר: בכוונה, לשימוש חוזר ועם תחזוקה לאורך זמן.

## הפתרון
Portfoliable הוא בונה פורטפוליו בקוד פתוח עם מערכת קייסים מובנית, רכיבי UI לשימוש חוזר וזרימת כתיבה מבוססת Markdown.[^next-he-2]

### עקרונות ליבה
- **הכותב במרכז:** כותבים פעם אחת ומפרסמים בביטחון.
- **מבוסס מערכת עיצוב:** רינדור דרך רכיבי Valence.
- **התוכן כמקור אמת:** הקייסים נשמרים בקבצים מנוהלי גרסאות.
- **נגיש כברירת מחדל:** שליטה בתנועה, ניגודיות וחוויית קריאה מובנית מראש.

### מה זה נותן לכם
- הקמה מהירה עם ברירות מחדל מכוונות.
- דפי קייס גמישים עם תוכן עניינים, תקציר, מדיה וניווט.
- תוכן מקומי לפי שפה עם מטא-דאטה מותאם.
- תהליכי CLI עקביים לצוותים.

---

## תהליך CLI
יוצרים קייס חדש תוך שניות:

```bash
npm run portfoliable-create-case -- --name "Checkout Revamp"
```

ואז ממשיכים לערוך בעורך:

- עדכון המטא-דאטה בבלוק הקונפיג
- כתיבת הסיפור ב-Markdown
- תצוגה מקדימה דרך סביבת האפליקציה

## דוגמת קונפיג קצרה
```json
{
  "id": "checkout-revamp",
  "title": { "en": "Checkout Revamp" },
  "showToc": true,
  "showSummary": true
}
```

## יכולות Markdown שמופעלות בתבנית הזו
הטבלה הבאה ממפה דפוסים נפוצים שנמצאים בקייסים אמיתיים:

| יכולת | למה זה חשוב | דוגמה |
| --- | --- | --- |
| כותרות | מבנה סיפורי שקל לסרוק | `## Context` |
| הדגשות | הדגשת החלטות מרכזיות | `**impact**`, `*tradeoff*` |
| בלוקי קוד | הסבר פרטי יישום | fenced code עם שפה |
| טבלאות | השוואת אפשרויות ותוצאות | מטריצת החלטות |
| רשימות | העברת שלבים ועדיפויות | ממוספרת + תבליטים |
| הערות שוליים | הוספת ניואנס בלי עומס | הפניות והסתייגויות |

## יומן החלטות
מונח
: חוויית פורטפוליו באיכות מוצר

מגבלה
: לשמור את הכתיבה פשוטה גם למי שלא מפתחים

פשרה
: להעדיף מוסכמות על פני התאמה בלתי מוגבלת

## רשימת מסירה
- [x] סכמת קייס עם שדות מקומיים
- [x] קומפוזיציה של Reader + Summary + Navigator
- [x] סיפור מבוסס Markdown
- [ ] תוכן פרודקשן מוכן לפרסום בכל לוקאל

## הערות
אפשר להתחיל בקטן ולהרחיב בהמשך. תיעוד פרקטי עדיף על המתנה לתנאים מושלמים.

למידע נוסף:
- [אתר Portfoliable](https://www.portfoliable.js.org/)
- [מאגר Portfoliable](https://github.com/portfoliablejs/portfoliable)

הקייס הזה קצר בכוונה, אבל ניתן להרחבה.[^next-he-3]

[^next-he-1]: הוסיפו לקייס אמיתי גם הקשר, מגבלות, חלופות, תוצאות, מדדים ורטרוספקטיבה.
[^next-he-2]: אפשר להתאים את המבנה הזה לזרימות מוצר, מחקר או Design System.
[^next-he-3]: זה בסיס מהיר לבדיקה, ואפשר לפתח אותו למסמך פרויקט מלא.
