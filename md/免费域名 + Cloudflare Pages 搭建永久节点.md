---
title: Edgetunnel2.0 部署教程：免费域名 + Cloudflare Pages 零成本搭建永久节点
author: Siky
description: >-
  Edgetunnel2.0 全新版本部署教程：用免费域名 + Cloudflare Pages 零成本搭建永久可用的代理节点。涵盖 Pages 上传部署、ADMIN 变量、KV 绑定、自定义域名、随机优选 / 自定义优选 / 优选订阅生成器三种优选方式，以及 VLESS/Trojan 协议切换、Telegram Bot 通知、请求数统计等进阶玩法。
tags: 'Cloudflare,网络技术,Edgetunnel'
crtime: 1793348715122
uptime: 1793588226399
---

> 本文整理自 [CMLiussss Blog 的 Edgetunnel2.0 教程](https://fastly.blog.cmliussss.com/p/edt2/)，项目源码：[cmliu/edgetunnel](https://github.com/cmliu/edgetunnel)

想要一个稳定、免费、还能解锁 ChatGPT / Gemini 的代理节点，通常的思路是买机场或者租 VPS 自建。其实还有第三条路：用一个免费域名 + Cloudflare Pages，零成本跑起来一套 `edgetunnel` 项目，就能得到一个永久可用的节点，实测 4K 流畅。

Edgetunnel 最近发布了 **2.0 全新版本**，集百家之所长，全新升级了传输架构，还带来了一个 WebUI 管理面板——修改配置不再需要改动变量然后重试部署，点一下「保存」即刻生效。这篇文章就把完整部署流程从头到尾梳理一遍。

## 2.0 有哪些改进？

- **全新传输架构**：兼容性和稳定性都大幅提升
- **更简化的配置流程**：新增 WebUI 用户界面，修改配置无需改动变量重试部署，点击保存即刻生效
- **多协议支持**：一次部署，在线切换 VLESS、Trojan 传输协议
- **内置三网优选 IP**：根据三网自动分配优选 IP，优选 IP 想要多少就有多少
- **自定义优选**：支持在线优选（自选落地国家）、优选 API 接入（自动化实时优选）
- **反代出口**：除了 ProxyIP，还支持 SOCKS5 / HTTP 出口，实现链式代理
- **Telegram Bot 通知**：实时获取项目访问、登录、订阅等消息
- **CF 请求数统计**：配置 Account ID / API Token，实时查看当天 Workers/Pages 请求使用情况
- **日志中心**：查看所有可疑的登录、订阅操作

Demo 面板预览：[Edgetunnel2.0 WebUI](https://edt-pages.github.io/admin)

![demo](./../assets/edt2/demo.png)

## 准备项

- 一个 Cloudflare 账号，注册地址：<https://www.cloudflare.com>
- 一个可用域名（可免费注册，后文会给出免费域名清单）
- 两个压缩包，需提前下载到本地：
  - Pages 演示项目：[direct-upload-demo.zip](/direct-upload-demo.zip)
  - Edgetunnel 项目源码：[edgetunnel-main.zip](https://github.com/cmliu/edgetunnel/archive/refs/heads/main.zip)

本教程采用 **Pages 上传** 方式部署，因为它没有任何门槛（也支持 Workers、Pages GitHub 等方式，详见[项目文档](https://github.com/cmliu/edgetunnel)）。

---

## 一、部署教程

### 1. 创建 Pages 应用程序

准备好 Cloudflare 账号后，点击「计算和 AI」>「Workers 和 Pages」>「创建应用程序」：

![创建Pages应用程序](./../assets/edt2/1-2-1.png)

![创建Pages应用程序](./../assets/edt2/1-2-0.png)

选择 `Pages` 选项卡，点击「拖放文件」>「开始使用」：

![创建Pages应用程序](./../assets/edt2/1-3-1.png)

项目名称填写任意值，但必须是**全新的名字**（避免出现 1101 错误），推荐末尾补上任意数字，比如 `edt123123123`：

![创建Pages应用程序](./../assets/edt2/1-4-1.png)

点击「从计算机中选择」>「上传压缩文件」，选择第一步下载的 `direct-upload-demo.zip`，等待上传完成：

![上传项目压缩包](./../assets/edt2/1-5-1.png)

点击「部署站点」，等待部署完成：

![部署Pages应用程序](./../assets/edt2/1-6-1.png)

提示成功即代表初始化部署完成，点击「继续处理项目」进入下一步设置变量、绑定 KV：

![部署成功](./../assets/edt2/1-7-1.png)

### 2. 设置管理员变量

进入项目设置页面，点击「设置」选项卡，添加变量和机密：

![进入项目设置页面](./../assets/edt2/2-1-1.png)

点击「+ 添加」，类型选择 `文本`，变量名称填 `ADMIN`，变量值为 WebUI 管理员密码（建议设置复杂密码，避免被暴力破解）：

![添加ADMIN变量](./../assets/edt2/2-2-1.png)

变量设置完成，如忘记密码可返回此页面查看：

![ADMIN变量设置完成](./../assets/edt2/2-3-1.png)

### 3. 绑定 KV 命名空间

点击「存储和数据库」>「Workers KV」>「+ Create Instance」创建一个命名空间：

![创建KV命名空间](./../assets/edt2/3-1-1.png)

命名空间名称可自定义，建议命名为 `EDT2` 以便区分，点击「创建」完成：

![命名空间创建完成](./../assets/edt2/3-2-1.png)

返回项目设置页面，点击「设置」>「绑定」>「+ 添加」>「KV 命名空间」：

![绑定命名空间](./../assets/edt2/3-3-1.png)

![绑定命名空间](./../assets/edt2/3-3-2.png)

变量名称**必须填写大写 `KV`**，命名空间选择刚刚创建的 `EDT2`，点击「保存」完成绑定：

![完成绑定](./../assets/edt2/3-4-1.png)

返回项目设置页面，确认绑定成功：

![绑定成功](./../assets/edt2/3-5-1.png)

### 4. 重试部署，使变量生效

点击右上角「创建部署」：

![重试部署](./../assets/edt2/4-1-1.png)

部署环境选择 `生产`，点击「从计算机中选择」>「上传压缩文件」，选择 `edgetunnel-main.zip` 压缩包，等待上传完成：

![重试部署上传压缩包](./../assets/edt2/4-2-1.png)

点击「保存并部署」，等待部署完成：

![重试部署保存并部署](./../assets/edt2/4-3-1.png)

![重试部署等待完成](./../assets/edt2/4-3-2.png)

> 注意：如需修改管理员密码，修改完变量之后**必须重新上传部署**，否则变量无法生效。

### 5. 绑定自定义域名

需要一个可用的域名。可免费注册 CNAME 域名的地方：

- **DNSHE**：<https://www.dnshe.com/>（部分域名可托管 CF）
- **DigitalPlat**：<https://domain.digitalplat.org/>（部分域名可托管 CF）
- **ClouDNS**：<https://www.cloudns.net/>（本文演示使用）
- **dynv6**：<https://dynv6.com/>
- **ZoneABC**：<https://zoneabc.net/>
- **Dynu**：<https://www.dynu.com/>（注册门槛最低）
- **Nodeloc**：<https://domain.nodeloc.com/>（免费短域名 loc.cc）
- 更多免费域名汇总：[发哥整理的免费域名资源](https://blog.zrf.me/p/Free-Domains/)

进入 Pages 应用程序，点击「自定义域」选项卡，点击「设置自定义域」：

![设置自定义域](./../assets/edt2/5-1-1.png)

添加自定义域。注意：如果你的域名是 `fxxk.cloudns.org`，则**必须多加一级域名**，例如 `edt2.fxxk.cloudns.org`：

![添加自定义域](./../assets/edt2/5-2-1.png)

选择「开始 CNAME 设置」：

![开始CNAME设置](./../assets/edt2/5-3-1.png)

记录名称填 `edt2`，CNAME 记录值填你的项目域名（如 `edt123123123.pages.dev`）：

![CNAME记录值](./../assets/edt2/5-4-1.png)

前往域名服务商添加 CNAME 记录：

![添加自定义记录](./../assets/edt2/5-5-1.png)

返回「自定义域」选项卡，点击「稍后完成 DNS 设置」等待域名验证成功：

![等待域名验证成功](./../assets/edt2/5-6-1.png)

等待 10~30 分钟，域名验证成功后即可看到绑定成功提示：

![域名绑定成功](./../assets/edt2/5-7-1.png)

### 6. 登录管理页面

访问 `/admin` 即可登录管理页面。例如你绑定的自定义域名是 `edt2.fxxk.cloudns.org`，则访问 `https://edt2.fxxk.cloudns.org/admin`：

![登录](./../assets/edt2/6-1-1.png)

输入管理员密码，点击「登录」：

![登录](./../assets/edt2/6-2-1.png)

登录成功后即可看到管理页面，如果你是小白，无需折腾直接订阅使用即可。

> 注意：部署成功后访问主页如果提示 `Welcome to nginx!`，这只是默认伪装页，说明你已经部署成功，请访问 `/admin` 进入管理页面。

![nginx欢迎页](./../assets/edt2/7-1-1.png)

---

## 二、自助优选订阅

Edgetunnel2.0 自带了三种优选订阅生成方式：随机优选（简单）、自定义优选（折腾）、优选订阅生成器（偷懒）。

### 1. 随机优选 - 简单

内置三网优选 IP，根据订阅时的网络自动分配对应三网优选 IP，优选 IP 想要多少就有多少。

![随机优选](./../assets/edt2/2-1-1-1.png)

- **随机优选数量**：要多少填多少，但建议不要过多，过多会导致触发域名真链接响应 `-1`
- **指定优选端口**：随机端口可抑制真链接响应 `-1`，也可指定 `443`、`2053`、`2083`、`2087`、`2096`、`8443` 端口

> 注意：更新订阅时不可使用代理更新订阅，否则会导致无法识别对应三网优选 IP，会自动降级为三网优选订阅（同时下发所有三网优选 IP）。

订阅呈现效果：

![呈现效果](./../assets/edt2/2-1-1-2.png)

### 2. 自定义优选 - 折腾

自由度最高，适合喜欢折腾的选手，提供手动添加、在线优选、优选 API 等多种接入方式。

#### 手动添加

你可以手动添加优选域名 / IP，格式为 `IP域名:端口#备注`，每行一条记录，例如：

```text
104.18.38.47:2053#这是优选IPv4案例
104.18.42.98:2096
172.64.145.158
[2a06:98c1:3101::ac40:919e]:2087#这是优选IPv6案例
[2a06:98c1:3108::6812:2a62]:8443
[2a06:98c1:3108::6812:919e]
www.visa.cn:443#这是优选域名案例
mfa.gov.ua:8443
www.shopify.com
```

> IPv6 地址必须使用方括号 `[]` 括起来；缺少端口时默认 `443`；缺少备注时直接显示 IP/域名。更多优选域名可通过 [CloudFlare 优选域名汇总](https://cf.090227.xyz/) 获取。

![手动添加](./../assets/edt2/2-1-2-1.png)

订阅呈现效果：

![呈现效果](./../assets/edt2/2-1-2-2.png)

#### 在线优选

点击「在线优选」按钮，注意**必须关闭代理并使用国内网络直连**，才能进行在线优选：

![在线优选](./../assets/edt2/z2-1-1.png)

- **IP 库**：默认 `CF官方列表`，推荐使用 `CM整理列表`（包含大部分三网优选 IP 段，不定期更新维护）
- **端口**：默认 `443`，可自行修改
- **测试线程数**：默认 `8`，电脑浏览器推荐 `16` 线程以上，手机浏览器推荐 `8`~`16` 线程

选择好参数后，点击「开始优选」，等待优选结果：

![在线优选](./../assets/edt2/z2-1-2.png)

点击你所需国家的标签，点击「追加保存」，然后点击「关闭」返回上级菜单：

![在线优选](./../assets/edt2/z2-1-3.png)

点击「保存」自定义优选结果：

![在线优选](./../assets/edt2/z2-1-4.png)

订阅呈现效果：

![呈现效果](./../assets/edt2/z2-1-0.png)

> 注意：如果你当前网络不在 CN 环境下，将不被允许使用在线优选功能。因为在代理环境下在线优选只会得到你代理所属地区的优选，毫无意义。只有在 CN 环境（国内没有 CF 数据中心）下，才能实现直连多国数据中心、需要优选。

#### 优选 API

**方式一：接入普通文本 API**

例如填入 `https://cf.090227.xyz/ct`，点击「可用性验证」：

![优选API](./../assets/edt2/z3-1-1.png)

如果返回格式符合 `IP域名:端口#备注`（每行一条记录），则代表 API 可用：

![优选API](./../assets/edt2/z3-2-1.png)

如果仅一次性导入，点击「追加结果」；需要实时获取数据则点击「追加 API」，然后点击「保存」：

![优选API](./../assets/edt2/z3-2-2.png)

订阅呈现效果：

![呈现效果](./../assets/edt2/z3-3-1.png)

**方式二：接入 [XIU2/CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest) 测速 CSV**

例如填入 `https://github.com/cmliu/WorkerVless2sub/raw/refs/heads/main/CloudflareSpeedTest.csv`，填写测速对应的「默认端口」后点击「可用性验证」：

![优选API](./../assets/edt2/z4-1-1.png)

返回格式符合要求即代表可用：

![优选API](./../assets/edt2/z4-2-1.png)

点击「追加结果」或「追加 API」，然后点击「保存」：

![优选API](./../assets/edt2/z4-2-2.png)

订阅呈现效果：

![呈现效果](./../assets/edt2/z4-3-1.png)

**方式三：接入 iptest 测速 CSV**

例如填入 `https://raw.githubusercontent.com/cmliu/WorkerVless2sub/refs/heads/main/addressescsv.csv`，点击「可用性验证」：

![优选API](./../assets/edt2/z5-1-1.png)

返回格式符合要求即代表可用：

![优选API](./../assets/edt2/z5-2-1.png)

点击「追加结果」或「追加 API」，然后点击「保存」：

![优选API](./../assets/edt2/z5-2-2.png)

订阅呈现效果：

![呈现效果](./../assets/edt2/z5-3-1.png)

### 3. 优选订阅生成器 - 偷懒

让大佬坐上来自己动，直接使用大佬的优选订阅生成器的优选结果。[CMLiussss 技术交流群](https://t.me/CMLiussss) 置顶里收集了众多大佬的优选订阅生成器，大家可以自行选择。

![优选订阅生成器](./../assets/edt2/2-1-3-1.png)

加入交流群，在群组置顶信息里找到优选订阅按钮：

![优选订阅生成器](./../assets/edt2/2-1-3-2.png)

复制优选订阅器的 `变量SUB` 对应的值备用：

![复制变量SUB](./../assets/edt2/2-1-3-3.png)

填入优选订阅生成器，点击保存即可：

![填写优选订阅生成器](./../assets/edt2/2-1-3-4.png)

订阅呈现效果：

![呈现效果](./../assets/edt2/2-1-3-4.png)

---

## 三、进阶功能

### 1. VLESS / Trojan 协议切换

Edgetunnel2.0 支持在线切换 VLESS / Trojan 传输协议：

![协议切换](./../assets/edt2/vt1-1-0.png)

返回管理页面，「⚙️ 详细配置信息」>「节点协议」，选择你需要的代理协议：

![协议切换](./../assets/edt2/vt1-1-1.png)

点击「保存」后，更新订阅即可生效：

![保存协议](./../assets/edt2/vt1-2-1.png)

### 2. 设置 Telegram Bot 通知

配置 Telegram Bot 后，可实时获取项目访问、登录、订阅等消息。

![可用请求数统计](./../assets/edt2/t1-1-0.png)

**① 创建 Bot**：添加 [@BotFather](https://t.me/BotFather)，发送 `/newbot` 创建 Bot，复制 Bot Token 备用，例如：

```text
8598918055:AAH50RfGC9tGTRoNKu9GaNSWcEfawUk5eh0
```

![创建Bot](./../assets/edt2/t1-1-1.png)

**② 启用机器人**：点击你的 bot 链接（如 `t.me/cm_edt2_bot`），点击「开始 / start」按钮：

![启用机器人](./../assets/edt2/t1-2-1.png)

**③ 获取 Chat ID**：加入 [CMLiussss 技术交流群](https://t.me/CMLiussss)，发送 `/id@nmnmfunbot` 命令获取你的 Chat ID，例如 `6946996027`：

![获取Chat ID](./../assets/edt2/t1-3-1.png)

**④ 参数配置**：返回管理页面，「🔔 消息通知设置」>「Telegram Bot 通知」>「⚙️参数配置」：

![参数配置](./../assets/edt2/t1-4-1.png)

**⑤ 填写参数并验证**：填写 Bot Token 和 Chat ID，点击「可用性验证」：

![参数填写](./../assets/edt2/t1-5-1.png)

**⑥ 保存**：如提示 `✅ Bot Token 和 Chat ID 均有效`，点击「保存」：

![保存](./../assets/edt2/t1-6-1.png)

同时机器人会同步提示 `✅ Telegram 通知配置已验证成功！`：

![机器人提示](./../assets/edt2/t1-6-2.png)

**⑦ 启用通知**：配置完成后，勾选「Telegram Bot 通知」>「启用」>「保存」：

![启用通知](./../assets/edt2/t1-7-1.png)

之后登录管理页面或获取订阅等操作时，均会同步收到机器人通知。

### 3. 设置 Workers/Pages 可用请求数统计

配置 CF Account ID / API Token 后，可实时获取当天 Workers/Pages 请求使用情况。

![可用请求数统计](./../assets/edt2/cf1-0-1.png)

**① 复制 Account ID**：登录 Cloudflare，「计算和 AI」>「Workers 和 Pages」，复制右下角 Account ID，例如：

```text
9b03a30c471a952197b8b8bb6f113456
```

![复制Account ID](./../assets/edt2/cf1-1-1.png)

**② 创建 API 令牌**：点击左侧「管理账户」>「账户 API 令牌」>「创建令牌」：

![创建API令牌](./../assets/edt2/cf1-2-1.png)

**③ 选择模板**：API 令牌模板选择「阅读分析数据和日志」，点击「使用模板」：

![选择API令牌模板](./../assets/edt2/cf1-3-1.png)

**④ 选择资源**：区域资源选择「账户的所有区域」，再选择你的 CF 账户邮箱，点击「继续以显示摘要」：

![选择区域资源](./../assets/edt2/cf1-4-1.png)

**⑤ 创建令牌**：

![创建令牌](./../assets/edt2/cf1-5-1.png)

**⑥ 复制 API 令牌**，例如：

```text
UQjdE9xzvK4oq32IaYRX7Z1-123YQvl3qLNwLQxE
```

![复制API令牌](./../assets/edt2/cf1-6-1.png)

**⑦ 参数配置**：返回管理页面，「🔔 消息通知设置」>「Cloudflare Workers/Pages 可用请求数统计」>「⚙️参数配置」：

![进入参数配置](./../assets/edt2/cf1-7-1.png)

![进入参数配置](./../assets/edt2/cf1-8-1.png)

**⑧ 填写并验证**：填写 Account ID 和 API Token，点击「可用性验证」：

![保存配置](./../assets/edt2/cf1-9-1.png)

如提示 `✅ 验证成功！` 并显示出「今天的请求配额」，点击「保存」。保存成功后自动刷新，即可看到请求数统计信息：

![可用请求数统计](./../assets/edt2/cf1-0-2.png)

### 4. 彩蛋：单面板管理多节点

10 万请求次数不够用？可以用单面板管理多节点：2 个账号部署即可实现 20w 请求数，3 个就是 30w，不够就自行续杯。同时还能有效降低 SNI 域名阻断情况（批量测试出现 `-1` 的情况）。

域名可以使用同一个域名绑定多个自定义域，例如：

- `edt2.fxxk.cloudns.org` → 第一个 EDT2.0，作为**面板**
- `edt2-2.fxxk.cloudns.org` → 第二个 EDT2.0，作为**节点**
- `edt2-3.fxxk.cloudns.org` → 第三个 EDT2.0，作为**节点**

**① 复制面板 UUID**：前往第一个 Edgetunnel2.0 管理页面，复制「⚙️ 详细配置信息」内的 UUID，例如 `8fc6a982-9862-4362-846f-a7039c5e2e47`：

![复制UUID](./../assets/edt2/m1-1-1.png)

**② 换号部署第二个节点**：用第二个 CF 账号部署第二个 Edgetunnel2.0 节点（依旧是上传 `edgetunnel-main.zip`）：

![创建Pages应用程序](./../assets/edt2/m1-2-1.png)

![创建Pages应用程序](./../assets/edt2/1-3-1.png)

![创建Pages应用程序](./../assets/edt2/1-2-0.png)

![上传项目压缩包](./../assets/edt2/1-5-1.png)

![部署Pages应用程序](./../assets/edt2/1-6-1.png)

![部署成功](./../assets/edt2/m1-2-2.png)

**③ 添加 UUID 变量**：进入项目设置页面，点击「设置」，添加变量 `UUID`，变量值为刚才复制的面板 UUID：

![进入项目设置页面](./../assets/edt2/2-1-1.png)

![添加UUID变量](./../assets/edt2/m1-4-1.png)

**④ 重试部署**：点击「创建部署」，重新上传 `edgetunnel-main.zip`，等待部署完成：

![重试部署](./../assets/edt2/4-1-1.png)

![重试部署上传压缩包](./../assets/edt2/4-2-1.png)

![重试部署保存并部署](./../assets/edt2/4-3-1.png)

![重试部署等待完成](./../assets/edt2/m1-7-1.png)

**⑤ 绑定自定义域**：进入「自定义域」，添加自定义域（必须和面板域名不一样），例如 `edt2-2.fxxk.cloudns.org`：

![设置自定义域](./../assets/edt2/m1-8-1.png)

![添加自定义域](./../assets/edt2/m1-9-1.png)

后续步骤同前面绑定 CNAME 记录，等待域名验证成功：

![等待提示绑定成功](./../assets/edt2/m1-9-2.png)

**⑥ 修改 HOST**：返回面板管理页面，修改「⚙️ 详细配置信息」内的 HOST 参数，加上第二个 EDT2 节点的 HOST，例如 `edt2-2.fxxk.cloudns.org`，点击「保存」：

![修改HOST](./../assets/edt2/m1-10-1.png)

![修改HOST](./../assets/edt2/m1-10-2.png)

![修改HOST](./../assets/edt2/m1-10-3.png)

订阅呈现效果：

![呈现效果](./../assets/edt2/m0-1-1.png)

---

## 结语

Edgetunnel2.0 相比 1.x 提升巨大，尤其是 WebUI 面板的上线，让原本繁琐的「改变量 + 重新部署」变成了「点一下就生效」。配合随机优选、自定义优选、优选订阅生成器，以及单面板管理多节点的彩蛋玩法，零成本也能跑出一个相当能打的节点。

- 项目地址：<https://github.com/cmliu/edgetunnel>
- 原文教程：<https://fastly.blog.cmliussss.com/p/edt2/>
- 技术交流群：<https://t.me/CMLiussss>
