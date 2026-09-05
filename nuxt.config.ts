// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  runtimeConfig: {
    apiBase: process.env.API_BASE || 'http://localhost:8080'
  },

  modules: ['@nuxt/content'],

  // 运行时 parseMarkdown（后台 API 动态内容）的 SSR 高亮走内部路由
  // /api/_mdc/highlight，@nuxt/content 默认给 mdc 塞了 noApiRoute: true
  // 导致该路由不注册、SSR 高亮 404 被静默吞掉，必须显式关掉
  mdc: {
    highlight: {
      noApiRoute: false
    }
  },

  // 监听所有网卡，使局域网内设备也能访问（手机 / 同 Wi-Fi 的其他电脑）
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'spotgalaxy · 个人博客',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content: 'spotgalaxy的个人博客 — 关于技术、设计、阅读与生活的缓慢思考。'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'spotgalaxy' },
        { property: 'og:title', content: 'spotgalaxy · 个人博客' },
        {
          property: 'og:description',
          content: '关于技术、设计、阅读与生活的缓慢思考。'
        }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark'
          },
          langs: [
            "1c", "1c-query", "abap", "actionscript", "actionscript-3", "ada", "adoc", "ahk",
            "ahk1", "ahk2", "angular-html", "angular-ts", "apache", "apex", "apl", "applescript",
            "ara", "as3", "asciidoc", "asm", "astro", "awk", "ballerina", "bash",
            "bat", "batch", "be", "beancount", "berry", "bibtex", "bicep", "bird",
            "bird2", "blade", "bsl", "c", "c3", "cadence", "cairo", "cdc",
            "chapel", "chpl", "cjs", "clarity", "clj", "clojure", "closure-templates", "cmake",
            "cmd", "cobol", "codeowners", "codeql", "coffee", "coffeescript", "common-lisp", "console",
            "coq", "cpp", "cql", "crystal", "cs", "csharp", "css", "csv",
            "cts", "cue", "cypher", "d", "dart", "dax", "desktop", "diff",
            "docker", "dockerfile", "dotenv", "dream-maker", "edge", "elisp", "elixir", "elm",
            "emacs-lisp", "erb", "erl", "erlang", "f", "f03", "f08", "f18",
            "f77", "f90", "f95", "fennel", "fish", "fluent", "for", "fortran-fixed-form",
            "fortran-free-form", "fs", "fsharp", "fsl", "ftl", "gd", "gdresource", "gdscript",
            "gdshader", "genie", "gherkin", "git-commit", "git-rebase", "gjs", "gleam", "glimmer-js",
            "glimmer-ts", "glsl", "gn", "gnuplot", "go", "gql", "graphql", "groovy",
            "gts", "hack", "haml", "handlebars", "haskell", "haxe", "hbs", "hcl",
            "hjson", "hlsl", "hs", "html", "html-derivative", "http", "hurl", "hxml",
            "hy", "imba", "ini", "jade", "java", "javascript", "jinja", "jison",
            "jl", "js", "json", "json5", "jsonc", "jsonl", "jsonnet", "jssm",
            "jsx", "julia", "just", "justfile", "kdl", "kotlin", "kql", "kt",
            "kts", "kusto", "latex", "lean", "lean4", "less", "liquid", "lisp",
            "lit", "llvm", "log", "logo", "lua", "luau", "make", "makefile",
            "markdown", "marko", "matlab", "mbt", "mbti", "md", "mdc", "mdx",
            "mediawiki", "mermaid", "mips", "mipsasm", "mjs", "mmd", "mojo", "moonbit",
            "move", "mts", "nar", "narrat", "nextflow", "nextflow-groovy", "nf", "nginx",
            "nim", "nix", "nsis", "nu", "nushell", "objc", "objective-c", "objective-cpp",
            "ocaml", "odin", "openscad", "org", "pascal", "perl", "perl6", "php",
            "pkl", "plsql", "po", "polar", "postcss", "pot", "potx", "powerquery",
            "powershell", "prisma", "prolog", "properties", "proto", "protobuf", "ps", "ps1",
            "pug", "puppet", "purescript", "pwsh", "py", "python", "ql", "qml",
            "qmldir", "qss", "r", "racket", "raku", "razor", "rb", "rbs",
            "reg", "regex", "regexp", "rel", "riscv", "ron", "rosmsg", "rs",
            "rst", "ruby", "ruby-signature", "rust", "sas", "sass", "scad", "scala",
            "scheme", "scss", "sdbl", "sh", "shader", "shaderlab", "shell", "shellscript",
            "shellsession", "smalltalk", "smithy", "solidity", "soy", "sparql", "spl", "splunk",
            "sql", "ssh-config", "stata", "styl", "stylus", "surql", "surrealql", "svelte",
            "swift", "system-verilog", "systemd", "talon", "talonscript", "tasl", "tcl", "templ",
            "terraform", "tex", "tf", "tfvars", "toml", "tres", "ts", "ts-tags",
            "tscn", "tsp", "tsv", "tsx", "turtle", "twig", "typ", "typescript",
            "typespec", "typst", "v", "vala", "vb", "verilog", "vhdl", "vim",
            "viml", "vimscript", "vue", "vue-html", "vue-vine", "vy", "vyper", "wasm",
            "wenyan", "wgsl", "wiki", "wikitext", "wit", "wl", "wolfram", "xml",
            "xsl", "yaml", "yml", "zenscript", "zig", "zsh"
          ]
        }
      }
    }
  },

  nitro: {
    prerender: {
      routes: ['/rss.xml']
    }
  }
})
