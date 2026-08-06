<div style = "text-align:center;font-weight:bold;font-size:11px;padding:1px 0;border-top:1.5px solid #333;border-bottom:1.5px solid #333;letter-spacing:3px;margin-bottom:2px" >
{/* Ticket Title + Entry Counts */
}
<div className = "tk"
style = {
{
    textAlign: 'center', fontWeight
:
    'bold', fontSize
:
    '11px',
        padding
    {/* Ticket Title + Entry Counts */
    }
    <div className = "tk"
    style = {
    {
        textAlign: 'center', fontWeight
    :
        'bold', fontSize
    :
        '11px',
            padding
        {/* Ticket Title + Entry Counts */
        }
        <div className = "tk"
        style = {
        {
            textAlign: 'center', fontWeight
        :
            'bold', fontSize
        :
            '11px',
                padding
        :
            '1px 0', borderTop
        :
            '1.5px solid #333', borderBottom
        :
            '1.5px solid #333',
                letterSpacing
        :
            '3px', marginBottom
        :
            '2px'
        }
    }>
        入
        园
        人
        数
        < span
        style = {
        {
            fontSize: '8px', fontWeight
        :
            'normal', color
        :
            '#e53e3e', letterSpacing
        :
            '0'
        }
    }>
        {
            ' '
        }
        {
            result.items.map(item => `${item.product_name} NO.${item.entry_count}`).join(' · ')
        }
        </span>
        < /div>
    :
        '1px 0', borderTop
    :
        '1.5px solid #333', borderBottom
    :
        '1.5px solid #333',
            letterSpacing
    :
        '3px', marginBottom
    :
        '2px'
    }
}>
    入
    园
    人
    数
    < span
    style = {
    {
        fontSize: '8px', fontWeight
    :
        'normal', color
    :
        '#e53e3e', letterSpacing
    :
        '0'
    }
}>
    {
        ' '
    }
    {
        result.items.map(item => `${item.product_name} NO.${item.entry_count}`).join(' · ')
    }
    </span>
    < /div>
:
    '1px 0', borderTop
:
    '1.5px solid #333', borderBottom
:
    '1.5px solid #333',
        letterSpacing
:
    '3px', marginBottom
:
    '2px'
}
}>
入
园
人
数
< span
style = {
{
    fontSize: '8px', fontWeight
:
    'normal', color
:
    '#e53e3e', letterSpacing
:
    '0'
}
}>
{
    ' '
}
{
    result.items.map(item => `${item.product_name} NO.${item.entry_count}`).join(' · ')
}
</span>
< /div>
人
数 < span
style = "font-size:8px;font-weight:normal;color:#e53e3e;letter-spacing:0" > $
{
    entryCountsLine
}
</span>
< /div>
<div style="text-align:center;font-weight:bold;font-size:11px;padding:1px 0;border-top:1.5px solid #333;border-bottom:1.5px solid #333;letter-spacing:3px;margin-bottom:2px">
    入园人数: <span style="font-size:8px;font-weight:normal;color:#e53e3e;letter-spacing:0">${entryCountsLine}</span>
</div>
