import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Upload, Icon, Modal,Button,Input,notification} from 'antd'
import styles from './UploadFile.less'

const getFileList = (files) => {
  if (Array.isArray(files)) {
    return files.map((item, key) => {
      const urlArr = item.url.split('/')
      return { url: item.url, id: item.id, uid: key,key:item.key,name: urlArr[urlArr.length - 1], status: 'done' }
    })
  }
  if (files && !!files.length) {
    const filesArr = files.split('/')
    return [{ uid: -1, url: files, name: filesArr[filesArr.length - 1], status: 'done' }]
  }
  return ''
}

function renderAccecpt (accept) {
  if (!accept) {
    return null
  }
  if (['image', 'video', 'audio'].find(ext => ext === accept)) {
    return `${accept}/*`
  }
  if (accept === 'zip') {
    return 'application/zip,application/x-zip,application/x-zip-compressed'
  }
  return `.${accept}`
}

class UploadFiles extends Component {
  static propTypes = {
    files: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    onUpload: PropTypes.func.isRequired,
    multiple: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    disabled: PropTypes.bool,
    path: PropTypes.string,
    accept: PropTypes.string,
  }
  constructor (props) {
    super(props)
    this.state = {
      previewVisible: false,
      previewImage: '',
      files: getFileList(props.files),
      webpicVisible:false,
      weburl:''
    }
  }

  componentWillReceiveProps (nextProps) {
    if (Array.isArray(this.props.files) && !this.props.files.length && !!nextProps.files.length) {
      this.setState({ files: getFileList(nextProps.files) })
    }
  }
  showWebPic=()=>{
    this.setState({webpicVisible:true})
  }
  picInputChange=(e)=>{
    this.setState({weburl:e.target.value})
  }
  useWebPic=()=>{
    const {weburl,files} = this.state;
    const ishttp=weburl.indexOf('http')>-1;
    const isimg =weburl.indexOf('.jpg')>-1||weburl.indexOf('.png')||weburl.indexOf('.jepg')>-1;
    if(!ishttp||!isimg){
      return notification.error({message: '添加失败',description:"非法链接"});
    }
    let newFiles = [];
    const obj={uid:files.length+1,id:files.length+1,url:weburl,key:weburl.split('.com')[1],status:'done'};
    newFiles.push(obj);
    this.props.onUpload(obj);
    this.setState({files:newFiles,webpicVisible:false})
  }
  render () {
    const { previewVisible, webpicVisible,previewImage,files} = this.state
    const { multiple = 1,showWeb,onUpload,onRemove, disabled,data,path, accept } = this.props
    const renderFiles = (fileList) => {
      const newFiles = fileList.map((file) => {
        return file.response ? {id:file.response.data.id,url:file.response.data.url,key:file.response.data.key} : file
      })
      if (multiple === 1) {
        return newFiles[0]
      }
      return newFiles
    }
    //post url
    let actionUrl = `${API_URL}/file`
    if (path) {
      actionUrl += `&path=${path}`
    }
    const uploadProps = {
      accept: renderAccecpt(accept),
      action: actionUrl,
      headers: {
        'X-Requested-With': null,
      },
      data:data,
      disabled,
      listType: 'picture-card',
      fileList: files,
      multiple: multiple === true,
      onPreview: (file) => {
        this.setState({
          previewImage: file.url || file.thumbUrl,
          previewVisible: true,
        })
      },
      beforeUpload: () => {
        return true
      },
      onChange: ({ file, fileList }) => {
        this.setState({ files: fileList })
        if (file.percent === 100 && file.status === 'done') {
          onUpload(renderFiles(fileList, 1))
        }
      },
      onRemove: (file) => {
        let fileKey;
        const {response,key} = file;
        fileKey=key;
        if(response){
          fileKey=response.data.key;
        }
        if (disabled) {
          return false
        }
        const fileList = this.state.files.filter(item => item.uid !== file.uid)
        onUpload(renderFiles(fileList, 0))
        onRemove(fileKey);
        return true
      },
    }
    const modalProps = {
      visible: previewVisible,
      footer: null,
      onCancel: () => this.setState({ previewVisible: false }),
    }
    const modalPropsPic = {
      title:'添加网络图片',
      visible: true,
      onCancel: () => this.setState({webpicVisible:false}),
      onOk:()=>this.useWebPic()
    }
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">本地上传</div>
      </div>
    )
    return (
      <div className="clearfix">
        <Upload {...uploadProps}>
          {multiple === true ? uploadButton : (files.length < multiple && uploadButton)}
        </Upload>
        {showWeb&&<Button icon="plus" onClick={this.showWebPic}>网络图片</Button>}
        <Modal {...modalProps}>
          <img className={styles.previewImage} src={previewImage} />
        </Modal>
        {webpicVisible&&<Modal {...modalPropsPic} >
            <Input placeholder="输入图片链接..." onChange={this.picInputChange} style={{width:'100%'}}/>
        </Modal>}  
      </div>
    )
  }
}

export default UploadFiles