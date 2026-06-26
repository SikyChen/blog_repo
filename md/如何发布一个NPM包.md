---
title: 如何发布一个NPM包
author: Siky
description: >-
  当我们自己写了一个通用的 JavaScript 模块，想要分享出去给别人使用，一般都会把它作为 npm 包发布到官方仓库中，需要使用的时候再通过 `npm
  install xxx` 来安装即可。那么如何发布一个 npm 包呢？
crtime: 2021-06-20T12:15:12.000Z
uptime: 1782436229955
tags: 'Node,NPM'
---

# 如何发布一个NPM包

当我们自己写了一个通用的 JavaScript 模块，想要分享出去给别人使用，一般都会把它作为 npm 包发布到官方仓库中，需要使用的时候再通过 `npm install xxx` 来安装即可。

那么如何发布一个 npm 包呢？

### 创建项目

假设我们要创建一个可以提供算数方法的 npm 包，那么在本地创建一个目录，名为 `calculator` ，并进入。
    注：这个名字仅为说明之用，实际需要使用一个独一无二的包名，可到 npm 官网上查看自己的包名是否有重复）
``` shell
$ mkdir calculator
$ cd calculator/
```

既然是发布 npm 包，自然要通过 npm 来进行管理，首先在目录下创建 `package.json` 文件。
``` shell
$ npm init --yes # 使用 --yes 可以自动将创建过程中的问题以 y 回答
```
``` json
// package.json

{
  "name": "calculator",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

而后开始书写我们的程序，创建 index.js 文件，注意这里我们是在根目录创建的 index.js 文件，这个文件名及位置，需要与 `package.js` 中的 `main` 字段保持一致，加入我们想换一个位置和文件作为项目入口，可以手动修改 `main` 字段，如 `src/index.js`。

在入口文件中，添加并导出一个 `add` 方法
``` js
// index.js

module.exports.add = function add(a, b) { return a + b }
```

至此，我们的模块就完成了。现在进行发布。

首先，检查一下本地的 `npm registry` 是不是指向 npm 官方仓库，因为可能大多数人都将其改为指向淘宝镜像了。
``` shell
$ npm config get registry
http://registry.npmjs.org/
```

### 登录NPM

确认无误后，登录 npm
``` shell
$ npm addUser # 假若没有账号，则注册一个
$ npm login   # 假若已经有账号了，则直接登录
```

输入上面命令后，会陆续让回答几个问题，如 Username, Password, Email 等，都正确填写完就会自动登录成功了。
- 需要注意的是，使用 `npm addUser` 注册成功后，会向填写的邮箱当中发送一条认证邮件，需要先到邮箱中点击认证链接跳转页面认证成功后，才可以继续使用 npm 的功能。

### 发布

现在到了激动人心的发布的时候了，在命令行输入，将会得到类似下面的输出
``` shell
$ npm publish
npm notice 
npm notice 📦  calculator@1.0.0
npm notice === Tarball Contents === 
npm notice 57B  index.js    
npm notice 222B package.json
npm notice === Tarball Details === 
npm notice name:          calculator                                
npm notice version:       1.0.0                                   
npm notice package size:  328 B                                   
npm notice unpacked size: 279 B                                   
npm notice shasum:        c12fd4fd33d92627f754cc4b0d029b6b3df9c4b8
npm notice integrity:     sha512-rzIopSWVPTszG[...]8RAsoK6tzRYcg==
npm notice total files:   2                                       
npm notice 
+ calculator@1.0.0
```

- 注意如果这里报错，很有可能是自己的包名或版本跟 npm 仓库中已有的包名或版本冲突了，所以建议自己起一个独一无二的名字，并且到 https://www.npmjs.com/ 中搜索一下，如果没有搜到的包名，则说明可以使用了。到 `package.json` 中，将 `name` 字段改为新的可用的包名，然后再重新 `npm publish` 即可。

现在再到 npm 官网上去搜索该包名，应该可以查到了。

使用的时候，像其他普通 npm 一样，直接使用 `npm install xxx` 即可。

### 更新

假如我们的 npm 包做了一个修改，比如说新增了一个乘法的函数，如下
``` js
// index.js

module.exports.add = function add(a, b) { return a + b }
module.exports.multiply = function multiply(a, b) { return a * b }
```

由于是新增功能，所以我们的版本号需要再第二位进1️，可以到 `package.json` 中将 `version` 字段手动改为 `1.1.0` 。

也可以使用 npm 提供的功能进行版本修改，如
``` shell
$ npm version minor  # 修改主版本号，有 break change 的大版本升级时使用
$ npm version major  # 修改中间号，向后兼容，新增功能时使用
$ npm version patch  # 修改补丁号，修复bug时使用
```

- 这里简单说下版本号语义，我们的三位版本号如 `1.0.0` ，所对应上面的就是 `minor.major.patch` ，当阅读和修改版本号时，需按此规范。

希望通过对 npm 包的发布流程的了解，可以让 node.js 模块显得不那么神秘，也让我们对它的理解也可以进步一点点。
