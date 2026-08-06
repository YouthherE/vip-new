    const entryCountsLine = checkoutResult.items.map(item =>
      `${item.product_name} NO.${item.entry_count}`
    ).join(' · ');
