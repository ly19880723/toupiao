# 年会奖品意向问卷 - 云端版

基于 Animal Island UI 风格的全栈问卷应用，部署在 Vercel 上。

## 功能特性

- 动森风格温馨 UI（源自 animal-island-ui）
- 云端数据存储（PostgreSQL）
- 实时统计图表（大类 + 子类分层统计）
- 奖品数据在线管理
- 服务端密码验证
- 响应式适配

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL（推荐 Vercel Postgres 或 Supabase）
- **ORM**: Prisma

## 部署步骤

### 1. 创建 Vercel 项目

在 [vercel.com](https://vercel.com) 创建新项目，关联 GitHub/GitLab/Bitbucket 仓库。

### 2. 配置数据库

推荐使用 **Vercel Postgres**：

1. 在 Vercel Dashboard → Storage → Create Database → Vercel Postgres
2. 选择区域（建议选离你最近的）
3. 创建后，进入数据库详情 → `.env.local` 标签页
4. 复制 `POSTGRES_URL` 和 `POSTGRES_PRISMA_URL`

### 3. 配置环境变量

在 Vercel Dashboard → Project Settings → Environment Variables 添加：

| 变量名 | 值 | 说明 |
|--------|------|------|
| `DATABASE_URL` | 你的 PostgreSQL 连接字符串 | 数据库连接 |
| `ADMIN_PASSWORD` | 自定义密码（默认 9527） | 管理后台密码 |

如果使用 Vercel Postgres，直接复制 `.env.local` 中的值即可。

### 4. 初始化数据库

在本地或 Vercel CLI 中运行：

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 推送数据库 schema
npx prisma db push
```

如果是 Vercel Postgres，建议在本地配置好 `DATABASE_URL` 后运行 `prisma db push` 初始化表结构。

### 5. 部署

```bash
# 本地开发
npm run dev

# 构建（Vercel 会自动执行）
npm run build
```

提交代码到 Git 仓库，Vercel 会自动部署。

## 本地开发

```bash
# 1. 克隆仓库
git clone <your-repo-url>
cd animal-island-survey

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 DATABASE_URL 和 ADMIN_PASSWORD

# 4. 初始化数据库
npx prisma db push

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 数据库 Schema

### SurveyResponse（问卷提交记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (CUID) | 主键 |
| name | String | 姓名 |
| firstCat / firstSub | String | 一等奖大类/子类 |
| secondCat / secondSub | String | 二等奖大类/子类 |
| thirdCat / thirdSub | String | 三等奖大类/子类 |
| suggestions | String? | 年会建议（选填） |
| createdAt | DateTime | 提交时间 |

### PrizeData（奖品数据）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (CUID) | 主键 |
| key | String (Unique) | 大类标识 |
| label | String | 大类名称 |
| icon | String | 图标标识 |
| subs | Json | 子类数组 |
| sortOrder | Int | 排序 |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/submit | 提交问卷 |
| GET | /api/results | 获取所有问卷记录 |
| GET | /api/prizes | 获取奖品数据 |
| POST | /api/prizes | 更新奖品数据 |
| GET | /api/stats | 获取统计数据 |
| POST | /api/auth | 验证管理密码 |

## 默认密码

管理后台密码可在环境变量 `ADMIN_PASSWORD` 中配置，默认值为 `9527`。

## 数据来源

- UI 风格基于 [animal-island-ui](https://guokaigdg.github.io/animal-island-ui/)
- 初始奖品数据来自原 survey.html

## License

CC BY-NC 4.0（与原组件库保持一致）
