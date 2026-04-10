# 蒸人堂（Zhenrentang）

本仓库是一套 **将公众人物「蒸馏」为可对话人格** 的 Web 应用：把花叔开源的 [女娲.skill（nuwa-skill）](https://github.com/alchaincyf/nuwa-skill) 的思路落到产品上——先通过调研与提炼得到人物认知框架（心智模型、决策启发式、表达 DNA 等），写入 Skill；再在蒸人堂里 **单人对话** 或 **多人圆桌**，让不同蒸馏人格围绕同一话题依次发言。

- **女娲 / nuwa-skill**：方法论与蒸馏流程（如何造出一份高质量 `SKILL.md`）。见仓库说明：[alchaincyf/nuwa-skill](https://github.com/alchaincyf/nuwa-skill)。
- **蒸人堂**：在本仓库中挂载已蒸馏的 `personage/*/SKILL.md`，配置人物元数据后即可在浏览器中使用。

## 功能概览

- **人物大厅**：浏览已接入的人物卡片，按标签筛选。
- **单人对话**：进入 `/chat/[slug]`，与该人物蒸馏人格对话（服务端读取对应 Skill 作为系统提示基础）。
- **圆桌讨论**：`/roundtable` 选择至少两位人物与话题，多轮讨论。

## 本地启动

```bash
npm install
```

复制环境变量模板并按需填写（文件名以 Next 惯例为准，勿提交真实 Key）：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 中的 `OPENAI_*`（说明见下一节），然后：

```bash
npm run dev
```

默认开发服务器：**http://localhost:3023**（见 `package.json` 中 `dev` 脚本）。

生产构建：

```bash
npm run build
npm start
```

## API Key 与模型配置

应用使用 **OpenAI 兼容 API**（官方 OpenAI、DeepSeek、其它兼容服务商均可，视你的 Key 而定）。

### 环境变量（`.env.local`）

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | **必填**（若不在浏览器设置里填写）：API Key。 |
| `OPENAI_BASE_URL` | 可选，默认 `https://api.openai.com/v1`。使用 DeepSeek 等时请改为对应根地址（以服务商文档为准）。 |
| `OPENAI_MODEL` | 可选，未设置时默认 `gpt-4o`。 |

模板与注释见项目根目录 **[`.env.example`](./.env.example)**。

### 与界面「设置」的关系

- 在应用内 **设置** 中填写的 `apiKey` / `baseURL` / `model` 会存入浏览器 **localStorage**，请求时一并传给服务端。
- **优先级**：请求里带来的（设置里填的）非空 Key **优先于** 环境变量中的 `OPENAI_API_KEY`；`baseURL` / `model` 会与 `.env` 做合并解析（避免「只改了 .env 却仍指向默认 OpenAI」这类情况）。细节见 [`lib/openai-config.ts`](./lib/openai-config.ts)。

建议在团队开发时：**个人 Key 用 `.env.local` 或仅在自己浏览器设置**，勿把 Key 写进仓库。

## 如何贡献新人物

整体流程：**先蒸馏 → 再接入蒸人堂**。

### 1. 蒸馏人物（Skill）

推荐使用 [nuwa-skill](https://github.com/alchaincyf/nuwa-skill) 的流程与模板，生成独立人物 Skill（核心文件为 **`SKILL.md`**，并可附带 `references/` 等调研材料）。

安装与使用方式以该仓库 README 为准，例如：

```bash
npx skills add alchaincyf/nuwa-skill
```

在 Claude Code 等环境中按提示完成调研与提炼，得到可复用的人物 Skill 目录。

### 2. 写入本仓库 `personage/`

将蒸馏产物放到本仓库 **`personage/<你的-skill-目录名>/`** 下，并保证至少存在：

- `personage/<dir>/SKILL.md` — 服务端会按配置读取该文件作为该人物对话依据。

目录名 `<dir>` 需与下面配置文件中的 **`dir`** 字段一致（例如现有 `paul-graham-skill`、`zhangxuefeng-skill`）。

### 3. 配置 `personages.config.ts`

在 [`personages.config.ts`](./personages.config.ts) 的 `personagesConfig` 数组中 **新增一项**，字段含义见 [`types/index.ts`](./types/index.ts)：

- `slug`：URL 段，如 `paul-graham`，对应路由 `/chat/paul-graham`。
- `dir`：上一步 `personage/` 下的文件夹名。
- `name`、`description`、`tags`：展示用。
- `avatar`：公开路径，一般为 `/avatars/<文件名>.png`。
- `born` / `died`：可选，生卒信息（如 `YYYY-MM` 或 `YYYY-MM-DD`）；若填写 **`died`**，界面会对该人物头像启用悼念样式（黑白、献花交互）。

### 4. 头像 `public/avatars/`

将人物头像图片放入 **`public/avatars/`**，文件名与 `personages.config.ts` 里 `avatar` 路径一致，例如：

- `public/avatars/my-hero.png` → 配置中 `avatar: '/avatars/my-hero.png'`。

建议使用清晰、有授权或公开肖像权的图片，并控制体积以便加载。

### 5. 自检

- 首页能出现新卡片，点击进入对话无报错。
- 圆桌中能选中该人物并完成一轮请求。

---

**致谢**：[女娲 nuwa-skill](https://github.com/alchaincyf/nuwa-skill) 提供了「蒸馏思维方式」的方法论与社区实践；蒸人堂是在此之上的一层 **对话与圆桌产品壳**。
