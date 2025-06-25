import React from 'react';

const RecentProjects = ({ projects, onProjectClick }) => {
  // 如果没有项目，显示空状态
  if (!projects || projects.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        height: '100%',
        color: '#999',
        textAlign: 'center'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11v6M9 14h6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: '14px', margin: 0 }}>暂无最近项目</p>
        <p style={{ fontSize: '12px', margin: '8px 0 0 0', opacity: 0.7 }}>打开或创建项目后将显示在这里</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {projects.map((project, index) => (
        <div
          key={index}
          onClick={() => onProjectClick(project)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: '#f9f9f9',
            border: '1px solid #f0f0f0'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0ff';
            e.currentTarget.style.borderColor = '#d6d6ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f9f9f9';
            e.currentTarget.style.borderColor = '#f0f0f0';
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: '#eeeeff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            color: '#722ED1'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {project.name || project.path.split('/').pop().split('\\').pop()}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#999',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '2px'
            }}>
              {project.path}
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            whiteSpace: 'nowrap',
            marginLeft: '8px'
          }}>
            {project.lastOpened ? new Date(project.lastOpened).toLocaleDateString() : ''}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentProjects; 