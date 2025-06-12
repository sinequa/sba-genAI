# General Assistant Documentation

https://doc.sinequa.com/assistant/3.9/

# Customize the Assistant styling

The assistant web components use CSS variables to handle many CSS properties such as the colors, layout and spacing. It allows an easy customization anywhere the assistant is being used.

Here are all the available variables and their default values:

```scss
// Layout
--ast-chat-container-width: 100%;
--ast-chat-settings-width: 100%;
--ast-user-message-float: none;
--ast-reference-bottom: 0.3em;
// Spacing
--ast-chat-padding-top: 0;
--ast-chat-padding-bottom: 0;
--ast-message-padding: .075rem;
--ast-message-border-radius: 1rem;
--ast-chat-settings-padding-top: 0;
--ast-chat-settings-padding-bottom: 0;
--ast-reference-padding: 0 0.2em;
--ast-reference-margin: 0 0.1em;
--ast-reference-border-radius: 0.2em;
// Variables
--ast-size-0: 0rem;
--ast-size-1: 0.25rem;
--ast-size-2: 0.5rem;
--ast-size-3: 0.75rem;
--ast-size-4: 1rem;
--ast-size-5: 1.25rem;
--ast-size-6: 1.5rem;
// Font
--ast-user-font-weight: 500;
--ast-reference-font-weight: bold;
--ast-reference-message-font-size: 0.7em;
--ast-reference-attachment-font-size: 13px;
// Colors
--ast-primary-bg: #f2f8fe;
--ast-primary-color: #005DA7;
--ast-secondary-bg: #FFF8F1;
--ast-secondary-color: #FF732E;
--ast-saved-chat-hover-background: #FFF8F1;
--ast-input-bg: #F8F8F8;
--ast-input-color: #B0B0B0;
--ast-muted-color: rgba(33, 37, 41, 0.75);
--ast-reference-background-color: lightblue;
--ast-reference-color: black;
--ast-reference-expanded-hover-bg: white;
--ast-reference-icon-color: black;
--ast-reference-icon-active-color: white;
--ast-reference-passages-color: black;
```

The component handles a dark mode which is applied to it when it is included in a container with a `dark` CSS class. Here is a configuration example you can add into your application (the values applied here are the default ones already included in the component):

```scss
.dark {
    --ast-primary-bg: #0d0701;
    --ast-primary-color: #008cd1;
    --ast-secondary-bg: #00070e;
    --ast-secondary-color: #ffa258;
    --ast-input-bg: #070707;
    --ast-input-color: rgba(222, 218, 218, 0.75);
    --ast-muted-color: rgba(222, 218, 218, 0.75);
    --ast-saved-chat-hover-background: #262421;
    --ast-message-table-border-color: #333333;
    --ast-message-table-tr-bg: #070707;
    --ast-message-table-tr-border-color: #222222;
    --ast-reference-icon-color: black;
    --ast-reference-icon-active-color: black;
    --ast-reference-passages-color: white;
    --ast-reference-expanded-hover-bg: #262421;
    --ast-message-reference-color: black;
  }
```

These variables are to update in the application that uses the assistant itself, not inside the assistant itself (for example in a `your-project/styles/app.scss` file).