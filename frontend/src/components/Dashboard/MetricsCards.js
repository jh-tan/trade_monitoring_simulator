import React from 'react';
import { TrendingUp, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const MetricsCards = ({ marginStatus }) => {
  const metrics = [
    {
      title: 'Portfolio Value',
      value: formatCurrency(marginStatus.portfolioValue),
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Net Equity',
      value: formatCurrency(marginStatus.netEquity),
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Loan Amount',
      value: formatCurrency(marginStatus.loanAmount),
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Margin Status',
      value: marginStatus.marginCallTriggered ? 'CALL' : 'OK',
      icon: AlertTriangle,
      color: marginStatus.marginCallTriggered ? 'red' : 'gray'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      gray: 'text-gray-400'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <IconComponent className={`w-8 h-8 ${getColorClasses(metric.color)}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className={`text-2xl font-bold ${
                  metric.title === 'Margin Status' && marginStatus.marginCallTriggered 
                    ? 'text-red-600' 
                    : 'text-gray-900'
                }`}>
                  {metric.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;
