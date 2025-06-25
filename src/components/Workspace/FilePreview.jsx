import React, { useState, useEffect } from 'react';
import { formatFileSize, formatDate, validateBehaviorTree } from '../../utils/fileUtils';

const FilePreview = ({ file, onOpenProject }) => {
  const [fileContent, setFileContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  // 当选中文件发生变化时，加载文件内容
  useEffect(() => {
    const loadFileContent = async () => {
      if (!file || file.isDirectory) {
        setFileContent(null);
        setValidationResult(null);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        if (window.electron) {
          // 检查文件大小，避免加载过大文件
          const maxPreviewSize = 1024 * 1024; // 1MB
          if (file.size > maxPreviewSize) {
            setError(`文件过大，无法预览（${formatFileSize(file.size)}）。最大预览大小为 ${formatFileSize(maxPreviewSize)}`);
            setFileContent(null);
            return;
          }

          // 读取文件内容
          const result = await window.electron.ipcRenderer.invoke('read-file', file.path);
          if (result.success) {
            setFileContent(result.content);
            
            // 如果是JSON文件，验证是否为行为树格式
            if (file.name.toLowerCase().endsWith('.json')) {
              try {
                // 本地验证
                const validation = validateBehaviorTree(result.content);
                setValidationResult(validation);
              } catch (validationError) {
                console.error('验证JSON失败:', validationError);
                setValidationResult({
                  isValid: false,
                  message: `验证JSON失败: ${validationError.message}`
                });
              }
            } else {
              setValidationResult(null);
            }
          } else {
            setError(`无法读取文件: ${result.error}`);
            setFileContent(null);
            setValidationResult(null);
          }
        }
      } catch (error) {
        console.error('读取文件内容失败:', error);
        setError(`读取文件内容失败: ${error.message}`);
        setFileContent(null);
        setValidationResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFileContent();
  }, [file]);

  // 判断文件类型，用于格式化显示
  const getFileType = () => {
    if (!file) return '';
    if (file.isDirectory) return 'folder';
    
    const extension = file.name.split('.').pop().toLowerCase();
    switch (extension) {
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
      case 'scss':
        return 'css';
      default:
        return 'text';
    }
  };

  // 格式化JSON显示
  const formatJsonContent = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString; // 如果解析失败，返回原始内容
    }
  };

  // 渲染文件内容
  const renderFileContent = () => {
    if (!fileContent) return null;

    const fileType = getFileType();
    if (fileType === 'json') {
      return (
        <pre className="file-content json">
          {formatJsonContent(fileContent)}
        </pre>
      );
    }

    // 其他文件类型直接显示为文本
    return (
      <pre className={`file-content ${fileType}`}>
        {fileContent}
      </pre>
    );
  };

  // 渲染文件详情信息
  const renderFileDetails = () => {
    if (!file) return null;

    return (
      <div className="file-details">
        <div className="detail-item">
          <span className="detail-label">名称:</span>
          <span className="detail-value">{file.name}</span>
        </div>
        
        {!file.isDirectory && (
          <div className="detail-item">
            <span className="detail-label">大小:</span>
            <span className="detail-value">{formatFileSize(file.size || 0)}</span>
          </div>
        )}
        
        <div className="detail-item">
          <span className="detail-label">类型:</span>
          <span className="detail-value">
            {file.isDirectory ? '文件夹' : (file.type ? `.${file.type}` : '未知')}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">修改日期:</span>
          <span className="detail-value">{formatDate(file.lastModified || new Date())}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">路径:</span>
          <span className="detail-value path">{file.path}</span>
        </div>
      </div>
    );
  };

  // 渲染行为树验证结果
  const renderValidationResult = () => {
    if (!validationResult) return null;

    return (
      <div className={`validation-result ${validationResult.isValid ? 'valid' : 'invalid'}`}>
        <div className="validation-icon">
          {validationResult.isValid ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          )}
        </div>
        <div className="validation-message">
          {validationResult.message}
          
          {validationResult.isValid && onOpenProject && (
            <div className="validation-action">
              <button 
                className="btn-open-project" 
                onClick={() => onOpenProject(file.path)}
              >
                打开行为树
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="file-preview">
      {!file ? (
        <div className="no-file-selected">
          <div className="no-file-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M12 18v-6M9 15h6"></path>
            </svg>
          </div>
          <p>未选择文件</p>
          <p className="tip">从左侧选择一个文件以查看预览</p>
        </div>
      ) : (
        <>
          <div className="preview-header">
            <h3 className="preview-title">
              <span className="preview-icon">
                {file.isDirectory ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                )}
              </span>
              {file.name}
            </h3>
          </div>

          <div className="preview-content">
            {/* 文件详情 */}
            {renderFileDetails()}
            
            {/* 行为树验证结果 */}
            {!file.isDirectory && file.name.toLowerCase().endsWith('.json') && (
              renderValidationResult()
            )}
            
            {file.isDirectory ? (
              <div className="directory-message">
                <p>这是一个文件夹，请打开以查看内容</p>
              </div>
            ) : isLoading ? (
              <div className="loading-indicator">加载文件内容中...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              renderFileContent()
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .file-preview {
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
          overflow: hidden;
        }
        
        .no-file-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
        }
        
        .no-file-icon {
          margin-bottom: 16px;
          color: var(--text-disabled);
        }
        
        .no-file-selected p {
          margin: 4px 0;
        }
        
        .no-file-selected .tip {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .preview-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        
        .preview-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          display: flex;
          align-items: center;
        }
        
        .preview-icon {
          margin-right: 8px;
          display: flex;
          align-items: center;
        }
        
        .preview-content {
          flex: 1;
          overflow: auto;
          padding: 16px;
        }
        
        .file-details {
          background-color: var(--bg-secondary);
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .detail-item {
          display: flex;
          margin-bottom: 8px;
        }
        
        .detail-item:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          width: 80px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .detail-value {
          flex: 1;
          color: var(--text-primary);
          font-size: 14px;
          word-break: break-all;
        }
        
        .detail-value.path {
          font-family: monospace;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .file-content {
          background-color: var(--bg-secondary);
          border-radius: 4px;
          padding: 16px;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          font-family: monospace;
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-primary);
          margin: 0;
        }
        
        .directory-message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: var(--text-secondary);
          font-style: italic;
        }
        
        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: var(--text-secondary);
        }
        
        .error-message {
          padding: 16px;
          border-radius: 4px;
          background-color: rgba(255, 59, 48, 0.1);
          color: var(--color-danger);
          margin-bottom: 16px;
        }
        
        .validation-result {
          display: flex;
          align-items: flex-start;
          padding: 12px 16px;
          margin-bottom: 16px;
          border-radius: 4px;
        }
        
        .validation-result.valid {
          background-color: rgba(52, 199, 89, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(52, 199, 89, 0.2);
        }
        
        .validation-result.invalid {
          background-color: rgba(255, 59, 48, 0.1);
          color: var(--color-danger);
          border: 1px solid rgba(255, 59, 48, 0.2);
        }
        
        .validation-icon {
          margin-right: 12px;
          display: flex;
          align-items: center;
        }
        
        .validation-message {
          flex: 1;
        }
        
        .validation-action {
          margin-top: 12px;
        }
        
        .btn-open-project {
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-open-project:hover {
          background-color: var(--color-primary-dark, #5b25a8);
        }
      `}</style>
    </div>
  );
};

export default FilePreview; 