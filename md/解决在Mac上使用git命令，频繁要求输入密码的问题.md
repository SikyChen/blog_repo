---
title: 解决在Mac上使用git命令，频繁要求输入密码的问题
author: Siky
description: '检查：[ ssh-add -L ] 重置：[ ssh-add ]'
crtime: 2021-11-08T10:15:21.000Z
uptime: 1782436229955
tags: 'JavaScript,Node'
---

``` bash
$ git fetch
Enter passphrase for key '/Users/chensiqi/.ssh/id_rsa': 
```
在使用git命令时，突然频繁出现要求输入密码的问题，可能是ssh的代理被自动清除了，需要重新设置一次。

检查：
``` bash
$ ssh-add -L
The agent has no identities.
```

重新设置：
``` bash
$ ssh-add
Enter passphrase for /Users/chensiqi/.ssh/id_rsa: #在这里输入密码后回车，会显示下一行成功提醒
Identity added: /Users/chensiqi/.ssh/id_rsa (chensiqi/chensiqi@cvte.com)
```