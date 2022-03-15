<template>
  <div>
    <div class="menu">
      <div>
        <button class="menu-button" @click="open">打开</button>
        <button class="menu-button" @click="goBack">关闭</button>
        <button class="menu-button" @click="extractClicked(false)">提取</button>
        <button class="menu-button" @click="extractClicked(true)">解压</button>
        <button class="menu-button" @click="save">保存</button>
      </div>
      <button @click="reveal(asarPath)" class="filepath" :title="asarPath">
        『{{ title }}』👈
      </button>
    </div>
    <div class="content">
      <!-- 左侧文件结构区域 -->
      <div class="tree-view" :style="{ width: treeWidth + 'px' }">
        <FileBrowser search @get-path="onItemClicked" :directory-listing="tree" />
      </div>
      <!-- 右侧文件内容区 -->
      <div
        class="list-view"
        :style="{ width: `calc(100% - ${treeWidth}px)` }"
        @click="clearListFocus"
      >
        <!-- <FileList
            :tree="tree"
            v-model:dir="activeDir"
            @itemclick="onListItemClicked"
            @itemdoubleclick="onListItemDoubleClicked"
          /> -->
        <img v-show="showPic" :src="picSrc" alt="EFE" />

        <!-- ace editor -->
        <VAceEditor
          class="editor"
          v-show="!showPic"
          theme="chrome"
          :lang="editorOptions.lang"
          :options="aceEditorOptions"
          @init="aceEditorInit"
          v-model:value="editorOptions.value"
        />
      </div>
      <div class="resize" :style="{ left: `${treeWidth - 4}px` }" @mousedown="onMouseDown"></div>
    </div>
    <div class="footer">
      <div>{{ activeDir }}</div>
      <div>
        <span>{{ asarDetailString }}</span>
      </div>
    </div>
    <ModalExtract
      v-if="extractModalShow"
      :cmax="modal.cmax"
      :cpos="modal.cpos"
      :tmax="modal.tmax"
      :tpos="modal.tpos"
      :text="modal.text"
    />
    <!-- <div>{{ asarPath }}</div>
    <div>{{ activeDir }}</div>
    <div>{{ activePath }}</div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { openFile, formatSize } from '../utils';
import { setAsarPath, getters, setTree } from '../store/store';
import FileBrowser from '../components/FileBrowser/index.vue';
import ModalExtract from '../components/ModalExtract.vue';

import ace, { Ace } from 'ace-builds';
import { VAceEditor } from 'vue3-ace-editor';
import 'ace-builds/src-noconflict/theme-chrome';

import 'ace-builds/src-noconflict/ext-linking';
import 'ace-builds/src-noconflict/ext-hardwrap';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-json5';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/mode-typescript';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// // https://stackoverflow.com/questions/31767051/how-do-i-use-beautify-in-ace-editor
// const { beautify } = require('ace-builds/src-noconflict/ext-beautify');

ace.config.setModuleUrl(
  'basePath',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'https://cdn.jsdelivr.net/npm/ace-builds@' + require('ace-builds').version + '/src-noconflict/'
);

let aceEditor: Ace.Editor;

const Asar = window.Asar;
const { basename, join, extname } = window.Path;

export default defineComponent({
  components: {
    FileBrowser,
    ModalExtract,
    VAceEditor,
  },
  data() {
    const data: {
      picSrc: string;
      treeWidth: number;
      showPic: boolean;
      activePath: string;
      activeDir: string;
      selectedItems: ListItem[];
      asar: typeof Asar | null;
      extractModalShow: boolean;
      modal: {
        text: string;
        tmax: number;
        tpos: number;
        cmax: number;
        cpos: number;
      };
      editorOptions: any;
      aceEditorOptions: Partial<Ace.EditorOptions>;
    } = {
      picSrc: '',
      treeWidth: 200,
      showPic: false,
      activePath: '/plugin.json',
      activeDir: '/',
      selectedItems: [],
      asar: null,
      extractModalShow: false,
      modal: {
        text: '',
        tmax: 100,
        tpos: 75,
        cmax: 100,
        cpos: 25,
      },
      aceEditorOptions: {
        useWorker: true,
        fontSize: 12,
        tabSize: 2,
        wrap: true,
      },
      editorOptions: {
        value: '',
        lang: 'typescript',
      },
    };
    return data;
  },
  computed: {
    ...getters,
    title(): string {
      return basename(this.asarPath || '');
    },
    asarDetailString(): string {
      let folders = 0;
      let files = 0;
      Asar.walk(this.tree, (n: AsarNode) => {
        if (n.files) {
          folders++;
        } else {
          files++;
        }
      });
      return `文件: ${files}, 文件夹: ${folders - 1}, 大小: ${
        formatSize(this.asar?.getFileSize() || 0) || '未知'
      }`;
    },
  },
  async created() {
    if (this.asarPath) {
      await this.open(this.asarPath);
    }
  },
  mounted() {
    utools.onPluginOut(
      async () =>
        new Promise((resolve) => {
          this.closeAsar(); // 移除缓存文件
          setTimeout(resolve, 300);
        })
    );

    const { name, type } = this.tree[this.tree.length - 1];
    setTimeout(() => {
      type === 'file' && this.$nextTick(() => this.onItemClicked('/' + name));
    }, 800);
  },
  unmounted() {
    this.closeAsar();
  },
  methods: {
    aceEditorInit(editor: Ace.Editor) {
      aceEditor = editor;
    },
    async open(asarpath: string) {
      let path = asarpath;
      if (typeof path !== 'string') {
        path = await openFile();
      }
      if (extname(path) === '.asar') {
        this.closeAsar();
        setAsarPath(path);
        this.asar = Asar.open(path);
        this.asar.extract('.', this.asar._tmp);
        this.readHeader();
      }
    },
    readHeader() {
      if (this.asar) {
        setTree(this.asar.getHeader(true));
      }
    },
    clearListFocus() {
      this.selectedItems.forEach((item) => {
        item.focused = false;
      });
      this.selectedItems = [];
    },
    getFileType(file: string) {
      let language = '';
      switch (extname(file)) {
        case '.html':
          language = 'html';
          break;
        case '.js':
          language = 'typescript';
          break;
        case '.css':
          language = 'css';
          break;
        case '.json':
          language = 'json';
          break;
        case '.md':
          language = 'markdown';
          break;
        default:
          language = 'typescript';
          break;
      }
      return language;
    },
    async onItemClicked(filePath: string) {
      // console.log('===aceEditor===', this.tree, this.asar);
      if (!this.asar) return;
      this.activePath = filePath;
      if (/png|jp(e?)g|gif|svg/.test(extname(filePath))) {
        this.showPic = true;
        this.picSrc = 'file://' + this.asar.getSrc() + filePath;
        return;
      }
      this.showPic = false;
      const code = window.readFileSync(this.asar.getTempPath(filePath), 'UTF-8');
      const language = this.getFileType(filePath);
      this.editorOptions.lang = language;
      this.editorOptions.value = code;
    },
    async save() {
      const dest = this.activePath;
      // TODO 删除 所有 utools.getPath('temp') + this.title 下所有 .asarer-temp 缓存文件
      const newTempPath = join(utools.getPath('temp'), `${dest}.asarer-temp`);
      //  this.reveal(this.asar._tmp);
      window.writeFileSync(newTempPath, this.editorOptions.value, 'UTF-8');
      await this.asar.write(dest, newTempPath);
      window.rmSync(newTempPath);
    },
    //
    onListItemClicked(items: ListItem[]) {
      this.selectedItems = items;
      // todo
    },
    onListItemDoubleClicked(_e: MouseEvent, data: ListItem, path: string) {
      if (data.node?.files) {
        (this.$refs.tree as any).openFolder(path);
      }
    },
    goBack() {
      this.closeAsar();
      this.$router.back();
    },
    /**
     * 提取文件
     */
    async extractClicked(all = false) {
      const [savePath] =
        utools.showOpenDialog({
          properties: ['openDirectory', 'showHiddenFiles', 'createDirectory', 'promptToCreate'],
        }) || [];
      if (savePath) {
        if (all) {
          window.cpSync(this.asar._tmp, savePath);
          this.reveal(savePath);
        } else {
          await this.asar.extract(this.activePath, savePath);
          this.reveal(join(savePath, this.activePath));
        }
      }
    },
    closeAsar() {
      if (this.asar) {
        this.asar.close();
        this.asar = null;
      }
    },
    reveal(path: string) {
      const filePath = path || this.asarPath;
      utools.copyText(filePath);
      utools.shellShowItemInFolder(filePath);
    },
  },
});
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

.menu {
  position: fixed;
  z-index: 111;
  top: 0;
  width: 100%;
  background: linear-gradient(45deg, #0078d7, #5da9e4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  border-bottom: 1px solid #ccc;
  button {
    outline: none;
    font-size: 16px;
    background: transparent;
    border: none;
    color: #fff;
  }
  .menu-button {
    width: 70px;
    line-height: 2.2rem;
    transition: background 0.2s;
    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
    &:active {
      background: rgba(0, 0, 0, 0.4);
    }
  }
  .filepath {
    &:active {
      background: rgba(49, 74, 174, 0.4);
    }
  }
}

.tree-view {
  background-color: #f3f3f3;
  height: 100%;
}
.list-view {
  // display: flex;
  // justify-content: center;
  // align-items: center;
  background-color: rgba(186, 186, 186, 0.495);
}

// 内容区域
.content {
  display: flex;
  justify-content: space-between;
  text-align: left;
  margin-top: 42px;
  & > .resize {
    width: 4px;
    height: 100%;
    position: absolute;
    cursor: ew-resize;
    top: 0;
  }
  &.resize {
    cursor: ew-resize;
  }
}
.footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 29px;
  line-height: 29px;
  background: #f0f0f0;
  border-top: 1px solid #ccc;
  padding: 0 5px 0 5px;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.editor {
  width: 100%;
  height: calc(100vh - 42px - 30px);
}
</style>
