# asar-er

主要是方便查看 utools upx 插件源码

# 启动错误
`error:0308010C:digital envelope routines::unsupported`

解决办法：
```
$ set NODE_OPTIONS=--openssl-legacy-provider
$ npm run dev   # nr dev 无效
```

# TODO
1. 文件添加
2. 文件删除
3. ~~文件点击打包-或者自动备份源文件~~
4. 文件双击重命名
5. 右侧文件，显示定位到左侧树状菜单
6. 修改文件源码
7. 直接分析utools 的upx插件

# 问题
[fails with an error "No such file or directory"](https://github.com/electron/asar/issues/37)

# 参考
"asar-class-api": "github:toyobayashi/asar-class-api",
https://github.com/toyobayashi/asarx-vue
