import {Path, FileIdentity} from './pathtools';

// A workable config. Once this type is constructed it's guaranteed
// well formed for querying.
export type Config = Readonly<Required<
  Omit<ConfigBuilder, "maxFileSize" | "maxTotalSize"> & {
    maxTotalSize: number,
    maxFileSize: number
  }>>;


// OAuth authentication
export interface Auth {
  // canvas api token. Please check this page to see how to get a token.
  // https://github.com/hypothesis/lms/wiki/How-to-Test-the-Canvas-API
  key: string,

  // canvas api url
  url: string,
};


/*
 * ConfigBuilder is only used to represent the yaml file, and it allows partial
 * properties. Final config will be another type.
 * */

// fields unable to provide a default.
export interface ConfigBuilder {
  // canvas authentication information
  authentication?: Auth,
}

// type for building up config
export interface ConfigBuilder {
  // directory to stored downloaded files
  baseDir: Path,

  // specify stragegy for updating.
  update:
  // only download files that is not in current foler.
  | "newFileOnly"
  // allow overwirte
  | "overwride"

  // set verbosity of logging.
  verbosity: "mute" | "verbose" | "vverbose",
}

// fields that might not exist in yaml config file.
export interface ConfigBuilder {
  // snapshot directory
  snapshotDir?: Path,

  // max file size for a single file
  maxFileSize?: string,

  // limit of total file size.
  maxTotalSize?: string,

  // enable to allow downloading videos
  allowVideo?: boolean,

  // enable to allow download link
  allowLink?: boolean,

  // file name in this list will not be downloaded.
  fileBlackList?: string[],

  // file name in this list will not be downloaded.
  fileWhiteList?: string[],

  // fileExtensionBlackList: [".go", ".py", ".java"]
  fileExtensionBlackList?: string[],

  // fileExtensionWhiteList: [".pptx", ".jpg", ".hs"]
  fileExtensionWhiteList?: string[],
}



export type FileBuffer =
  & FileIdentity
  & {
    //  file content
    data: Int8Array,
  }

// Internal state of the spider.
// SpiderState will roughly maintain two types of data, either
// data received from the api and still in memory, or files already been
// written into the hard drive.

export interface SpiderState {
  // current config
  readonly config: Config,

  // list of new files arrived
  newFilesBuffer: [FileBuffer],

  // list of updated files
  updatedFilesBuffer: [FileBuffer],

  // current files
  currentFiles: [FileIdentity],

  // failed files
  failedFiles: [FileIdentity],
}
