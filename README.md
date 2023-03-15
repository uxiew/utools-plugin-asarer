# asar-er

主要是方便查看 utools upx 插件源码

启动错误
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

这个问题很简单。基本上很多应用程序都有一个 app.asar 文件，但它们也有一个 app.asar.unpacked 文件夹，用于存放一些不应该存在于 ASAR 中的文件。这意味着除非 app.asar.unpacked 和 app.asar 文件位于同一位置，否则 ASAR 文件将无法正确提取。

Read more here: [Adding Unpacked Files in asar Archive](https://www.electronjs.org/zh/docs/latest/tutorial/ASAR%E5%AD%98%E6%A1%A3#adding-unpacked-files-to-asar-archives)

# 参考
"asar-class-api": "github:toyobayashi/asar-class-api"

https://github.com/toyobayashi/asarx-vue
