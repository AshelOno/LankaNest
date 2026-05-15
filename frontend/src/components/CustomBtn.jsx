// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';

function CustomButton({
    btnName,
    btnType = 'default', // Ant Design button type (e.g., 'primary', 'default')
    htmlType = 'button',  // HTML button type (e.g., 'button', 'submit', 'reset')
    color,
    hoverColor,
    textColor,
    hoverTextColor,
    onClick,
    onDoubleClick,
    onFocus,
    onBlur,
    disabled = false,
    loading = false,
    icon,
    shape = 'default',
    size = 'default',
    style = {},
    className = '',
    ariaLabel = ''
}) {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    const handleDoubleClick = () => {
        if (onDoubleClick) {
            onDoubleClick();
        }
    };

    const handleFocus = () => {
        if (onFocus) {
            onFocus();
        }
    };

    const handleBlur = () => {
        if (onBlur) {
            onBlur();
        }
    };

    return (
        <Button
            type={btnType} // Ant Design button type
            htmlType={htmlType} // HTML button type
            className={`p-5 text-base font-bold rounded-full shadow ${className}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            loading={loading}
            shape={shape}
            size={size}
            icon={icon}
            aria-label={ariaLabel}
            style={{
                backgroundColor: isHovered ? hoverColor : color,
                color: isHovered ? hoverTextColor : textColor,
                borderColor: isHovered ? hoverColor : color,
                transition: 'background-color 0.3s, border-color 0.3s, color 0.3s',
                ...style
            }}
        >
            {btnName}
        </Button>
    );
}

CustomButton.propTypes = {
    btnName: PropTypes.string.isRequired,
    btnType: PropTypes.oneOf(['primary', 'default', 'dashed', 'text', 'link']),
    htmlType: PropTypes.oneOf(['button', 'submit', 'reset']),
    color: PropTypes.string,
    hoverColor: PropTypes.string,
    textColor: PropTypes.string,
    hoverTextColor: PropTypes.string,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    icon: PropTypes.node,
    shape: PropTypes.string,
    size: PropTypes.oneOf(['small', 'middle', 'large']),
    style: PropTypes.object,
    className: PropTypes.string,
    ariaLabel: PropTypes.string
};

export default CustomButton;
