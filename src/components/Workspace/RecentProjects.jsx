import React from 'react';
import { formatDate } from '../../utils/fileUtils';

const RecentProjects = ({ projects = [], isLoading = false, onOpenProject }) => {
  // 处理点击项目
  const handleProjectClick = (projectPath) => {
    if (onOpenProject) {
      onOpenProject(projectPath);
    }
  };

  return (
    <div className="recent-projects">
      {isLoading ? (
        <div className="loading-indicator">加载中...</div>
      ) : projects.length === 0 ? (
        <div className="no-projects">
          <div className="no-projects-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"></path>
              <path d="M13 2v7h7"></path>
            </svg>
          </div>
          <p>没有最近的项目</p>
          <p className="tip">创建一个新项目或打开现有项目以开始使用</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((project, index) => (
            <div 
              key={index} 
              className="project-card"
              onClick={() => handleProjectClick(project.path)}
            >
              <div className="project-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"></path>
                  <path d="M13 2v7h7"></path>
                </svg>
              </div>
              <div className="project-info">
                <h3 className="project-name">{project.name || '未命名项目'}</h3>
                <p className="project-path">{project.path}</p>
                <p className="project-date">最后打开: {formatDate(project.lastOpened || new Date())}</p>
              </div>
              <div className="project-actions">
                <button className="action-btn" onClick={(e) => {
                  e.stopPropagation();
                  handleProjectClick(project.path);
                }}>
                  打开
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx="true">{`
        .recent-projects {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
        }
        
        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: var(--text-secondary);
        }
        
        .no-projects {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: var(--text-secondary);
        }
        
        .no-projects-icon {
          color: var(--text-disabled);
          margin-bottom: 16px;
        }
        
        .no-projects p {
          margin: 4px 0;
        }
        
        .no-projects .tip {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .project-card {
          display: flex;
          align-items: start;
          padding: 12px;
          border-radius: 6px;
          background-color: var(--bg-secondary);
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid transparent;
        }
        
        .project-card:hover {
          border-color: var(--color-primary-light);
          background-color: var(--bg-secondary-hover);
        }
        
        .project-icon {
          margin-right: 12px;
          color: var(--color-primary);
          flex-shrink: 0;
        }
        
        .project-info {
          flex: 1;
          min-width: 0;
        }
        
        .project-name {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .project-path {
          margin: 0 0 2px;
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .project-date {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .project-actions {
          margin-left: 8px;
          flex-shrink: 0;
        }
        
        .action-btn {
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 4px;
          border: none;
          background-color: var(--color-primary);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .action-btn:hover {
          background-color: var(--color-primary-dark, #5b25a8);
        }
      `}</style>
    </div>
  );
};

export default RecentProjects; 