module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended", 
  "parserOptions": {
    "ecmaVersion": 6
  },
  "overrides": [
    {
      "files": ["test/*"],
      "globals": {
        "describe": "readonly",
        "it": "readonly"
      },
      "rules": {
        "no-console" : "off"
      }
    },
    {
      "files": ["wmt.js"],
      "globals": {
        "define": "readonly"
      },
      "rules": {
        "no-constant-condition" : ["error", { "checkLoops": false }],
        "no-prototype-builtins" : "off",
        "no-unused-vars": ["error", { "args": "none" }]
      }
    }
  ]
};
