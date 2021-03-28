// canvas-bot
// Copyright © 2020 ailrk

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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

export function isConfigUpdate(v?: string): v is ConfigBuilder["update"] {
  return ["newFileOnly", "overwirte"].includes(v ?? "");
}

export function isConfigVerbosity(v?: string): v is ConfigBuilder["verbosity"] {
  return ["mute" , "verbose" , "vverbose"].includes(v ?? "");
}


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
  | "overwrite"

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

  // can be course name, course code or id listed by course command.
  courseWhilteList?: string[],

  // can be course name, course code or id listed by course command.
  courseBlackList?: string[],


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
  newFiles: [string],

  // list of updated files
  updatedFiles: [string],

  // current files
  currentFiles: [string],

  // failed files
  failedFiles: [string],
}
