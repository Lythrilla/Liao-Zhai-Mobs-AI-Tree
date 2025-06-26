import React from 'react';

const RecentProjects = ({ projects, onProjectClick }) => {
  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      // 如果是今天
      if (date.toDateString() === now.toDateString()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 如果是昨天
      if (date.toDateString() === yesterday.toDateString()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 今年内的日期
      if (date.getFullYear() === now.getFullYear()) {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
      
      // 其他日期
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    } catch (error) {
      return '未知时间';
    }
  };

  // 如果没有项目，显示空状态
  if (!projects || projects.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#999',
        textAlign: 'center'
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11v6M9 14h6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: '16px', margin: 0 }}>暂无最近项目</p>
        <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.7 }}>打开或创建项目后将显示在这里</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
      {projects.map((project, index) => {
        // 获取文件扩展名
        const fileName = project.name || project.path.split(/[/\\]/).pop();
        const fileExt = fileName.split('.').pop().toLowerCase();
        const isJsonFile = fileExt === 'json';
        
        // 确定图标颜色
        const iconColor = isJsonFile ? '#722ED1' : '#5b8c00';
        const bgColor = isJsonFile ? '#f3f0ff' : '#f6ffed';
        
        return (
        <div
          key={index}
          onClick={() => onProjectClick(project)}
          style={{
            display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
              background: '#fff',
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              height: '100%'
          }}
          onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fafafa';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
                color: iconColor,
                flexShrink: 0
          }}>
                {isJsonFile ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M9 16s.5-1 2-1 2.5 1 4 1 2-1 2-1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
                )}
          </div>
              <div style={{ 
                flex: 1,
                overflow: 'hidden'
              }}>
            <div style={{
                  fontSize: '16px',
              fontWeight: 500,
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
                  {fileName}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  <span style={{
                    backgroundColor: isJsonFile ? '#f0f0ff' : '#f6ffed',
                    color: isJsonFile ? '#722ED1' : '#5b8c00',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    {fileExt}
                  </span>
                  <span>
                    {project.lastOpened ? formatDate(project.lastOpened) : ''}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{
              fontSize: '13px',
              color: '#666',
              padding: '10px',
              background: '#f9f9f9',
              borderRadius: '6px',
              wordBreak: 'break-all',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.4'
            }}>
              {project.path}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentProjects; 